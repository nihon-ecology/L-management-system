$(document).ready(function() {
  function formatDate() {
      var now = new Date();
      var month = now.getMonth() + 1; // 月は0始まりなので+1
      var day = now.getDate();
      var hours = now.getHours();
      var minutes = now.getMinutes();
      minutes = minutes < 10 ? '0' + minutes : minutes; // 0埋め

      var formattedTime = month + "月" + day + "日 " + hours + ":" + minutes;
      $(".boxTime__date span").text(formattedTime);
  }

  formatDate(); // ページ読み込み時に実行
});

$(document).ready(function() {
  function formatCustomDate() {
      var now = new Date();
      var month = now.getMonth() + 1; // 月は0始まりなので+1
      var day = now.getDate();

      var formattedDate = month + "月" + day + "日";
      $(".bar p span").text(formattedDate);
  }

  formatCustomDate(); // ページ読み込み時に実行
});

$(document).ready(function() {
  function formatCustomDate() {
      var now = new Date();
      var month = now.getMonth() + 1; // 月は0始まりなので+1

      var formattedDate = month + "月";
      $(".textTime span").text(formattedDate);
  }

  formatCustomDate(); // ページ読み込み時に実行
});

$(document).ready(function () {
  function checkVisibility() {
      var form = $('#form');
      var cta = $('.cta');
      var windowHeight = $(window).height();
      var scrollTop = $(window).scrollTop();
      var formTop = form.offset().top;
      var formBottom = formTop + form.outerHeight();

      // 画面内に#formが入ったら .cta に is-off クラスを追加
      if (formBottom > scrollTop && formTop < scrollTop + windowHeight) {
          cta.addClass('is-off');
      } else {
          cta.removeClass('is-off');
      }
  }

  $(window).on('scroll resize', checkVisibility);
  checkVisibility(); // 初回チェック
});