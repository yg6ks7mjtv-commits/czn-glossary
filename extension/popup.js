(function () {
  'use strict';
  var STORAGE_KEY = 'czn_enabled';
  var checkbox = document.getElementById('toggle');

  chrome.storage.local.get([STORAGE_KEY], function (result) {
    checkbox.checked = result[STORAGE_KEY] !== false; // 既定 ON
  });

  checkbox.addEventListener('change', function () {
    var value = {};
    value[STORAGE_KEY] = checkbox.checked;
    chrome.storage.local.set(value);
  });

  // AI翻訳（実験的機能）のON/OFF。既定OFF。用語置換・効果文表示とは
  // 独立したトグルにする。
  var TRANSLATE_STORAGE_KEY = 'czn_translate_enabled';
  var translateCheckbox = document.getElementById('translateToggle');

  chrome.storage.local.get([TRANSLATE_STORAGE_KEY], function (result) {
    translateCheckbox.checked = result[TRANSLATE_STORAGE_KEY] === true; // 既定 OFF
  });

  translateCheckbox.addEventListener('change', function () {
    var value = {};
    value[TRANSLATE_STORAGE_KEY] = translateCheckbox.checked;
    chrome.storage.local.set(value);
  });
})();
