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
})();
