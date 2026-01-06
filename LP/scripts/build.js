/**
 * LP Builder - 代理店別計測タグ自動挿入によるLP生成スクリプト
 * 
 * 使用方法:
 *   npm run build              # 全LP生成（prod + test）
 *   npm run build:prod         # 本番用のみ
 *   npm run build:test         # テスト用のみ
 *   npm run build -- --lp tokyo-subsidy          # 特定LP種類のみ
 *   npm run build -- --agency A8                 # 特定代理店のみ
 *   npm run build -- --lp tokyo-subsidy --agency A8  # 組み合わせ
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ================================
// 設定ファイル読み込み
// ================================
const loadConfig = (fileName) => {
  const filePath = path.join(ROOT_DIR, 'config', fileName);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
};

const agenciesConfig = loadConfig('agencies.json');
const regionsConfig = loadConfig('regions.json');
const lpTypesConfig = loadConfig('lp-types.json');

// ================================
// コマンドライン引数パース
// ================================
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    env: process.env.BUILD_ENV || 'all', // 'production', 'test', 'all'
    lpFilter: null,
    agencyFilter: null,
    watch: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--lp':
        options.lpFilter = args[++i];
        break;
      case '--agency':
        options.agencyFilter = args[++i];
        break;
      case '--watch':
        options.watch = true;
        break;
    }
  }

  return options;
};

// ================================
// テンプレートレンダリング
// ================================
const renderTemplate = async (templatePath, data) => {
  const template = await fs.readFile(templatePath, 'utf-8');
  return ejs.render(template, data, {
    filename: templatePath,
    async: true
  });
};

// ================================
// 静的資産（CSS/img/js）コピー
// ================================
const copyAssets = async (srcDir, destDir) => {
  const assetDirs = ['css', 'img', 'js'];
  
  for (const dir of assetDirs) {
    const srcPath = path.join(srcDir, dir);
    const destPath = path.join(destDir, dir);
    
    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }
};

// ================================
// 単一LPのビルド
// ================================
const buildSingleLP = async (options) => {
  const { lpType, agency, region, pattern, isTestMode, outputBase } = options;
  
  // 出力先ディレクトリ構成: dist/{env}/{lpType}/{region}/{agency}/{pattern}/
  const outputDir = path.join(
    outputBase,
    lpType.templateDir,
    region.id,
    agency.id,
    pattern || ''
  );
  
  await fs.ensureDir(outputDir);
  
  // テンプレートディレクトリ
  const templateDir = path.join(ROOT_DIR, 'src', 'templates', 'pages', lpType.templateDir);
  
  // テンプレートデータ
  const templateData = {
    agency,
    region,
    lpType,
    isTestMode,
    pattern,
    buildTime: new Date().toISOString()
  };
  
  // index.html 生成
  const indexTemplatePath = path.join(templateDir, 'index.ejs');
  if (await fs.pathExists(indexTemplatePath)) {
    const indexHtml = await renderTemplate(indexTemplatePath, templateData);
    await fs.writeFile(path.join(outputDir, 'index.html'), indexHtml);
  }
  
  // thanks/index.html 生成（設定で有効な場合）
  if (lpType.hasThankPage) {
    const thanksTemplatePath = path.join(templateDir, 'thanks.ejs');
    if (await fs.pathExists(thanksTemplatePath)) {
      const thanksDir = path.join(outputDir, 'thanks');
      await fs.ensureDir(thanksDir);
      const thanksHtml = await renderTemplate(thanksTemplatePath, templateData);
      await fs.writeFile(path.join(thanksDir, 'index.html'), thanksHtml);
    }
  }
  
  // 静的資産コピー（共通資産ディレクトリから）
  const assetsSourceDir = path.join(ROOT_DIR, 'src', 'assets', lpType.templateDir);
  if (await fs.pathExists(assetsSourceDir)) {
    await copyAssets(assetsSourceDir, outputDir);
  }
  
  console.log(`  ✓ ${outputDir}`);
};

// ================================
// 環境別ビルド
// ================================
const buildEnvironment = async (envName, isTestMode, options) => {
  const { lpFilter, agencyFilter } = options;
  const outputBase = path.join(ROOT_DIR, 'dist', envName);
  
  console.log(`\n📦 Building ${envName.toUpperCase()} environment...`);
  
  // 出力ディレクトリクリア
  await fs.emptyDir(outputBase);
  
  for (const [lpTypeKey, lpType] of Object.entries(lpTypesConfig.lpTypes)) {
    // フィルタリング
    if (lpFilter && lpType.templateDir !== lpFilter && lpTypeKey !== lpFilter) {
      continue;
    }
    
    console.log(`\n  📄 ${lpType.name}`);
    
    for (const regionId of lpType.regions) {
      const region = regionsConfig.regions[regionId];
      if (!region) continue;
      
      for (const agencyName of lpType.agencies) {
        // フィルタリング
        if (agencyFilter && agencyName !== agencyFilter) {
          continue;
        }
        
        const agency = isTestMode 
          ? { ...agenciesConfig.agencies[agencyName], tracking: agenciesConfig.testMode.tracking }
          : agenciesConfig.agencies[agencyName];
        
        if (!agency) continue;
        
        // パターンがある場合は各パターンでビルド
        if (lpType.patterns && lpType.patterns.length > 0) {
          for (const pattern of lpType.patterns) {
            await buildSingleLP({
              lpType,
              agency,
              region,
              pattern,
              isTestMode,
              outputBase
            });
          }
        } else {
          await buildSingleLP({
            lpType,
            agency,
            region,
            pattern: '',
            isTestMode,
            outputBase
          });
        }
      }
    }
  }
};

// ================================
// メイン実行
// ================================
const main = async () => {
  console.log('🚀 LP Builder Starting...\n');
  
  const options = parseArgs();
  
  console.log('📋 Build Options:');
  console.log(`   Environment: ${options.env}`);
  if (options.lpFilter) console.log(`   LP Filter: ${options.lpFilter}`);
  if (options.agencyFilter) console.log(`   Agency Filter: ${options.agencyFilter}`);
  
  const startTime = Date.now();
  
  try {
    if (options.env === 'all' || options.env === 'production') {
      await buildEnvironment('prod', false, options);
    }
    
    if (options.env === 'all' || options.env === 'test') {
      await buildEnvironment('test', true, options);
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Build completed in ${elapsed}s`);
    
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
};

main();
