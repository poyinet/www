/* ============================================================
   存档备份 Save Manager —— B1 功能体验
   导出：收集 localStorage 中全部 arcade_* 键 → JSON 字符串
        （含版本号与时间戳，可下载 / 复制）
   导入：解析 JSON → 逐键写入（仅 arcade_* 白名单），成功后刷新
   依赖：无（纯 localStorage 操作）
   ============================================================ */
window.SAVE_MGR = (function () {
  var PREFIX = 'arcade_';
  var VERSION = 1;

  function collect() {
    var out = {};
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) {
          out[k] = localStorage.getItem(k);
        }
      }
    } catch (e) {}
    return out;
  }

  /* 导出为 JSON 字符串 */
  function exportJSON() {
    var data = {
      app: 'decode-arcade',
      version: VERSION,
      exportedAt: new Date().toISOString(),
      data: collect()
    };
    return JSON.stringify(data);
  }

  /* 下载 .json 文件 */
  function download() {
    var json = exportJSON();
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'decode-arcade-save-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
    return json;
  }

  /* 导入：json 字符串 → 逐键写入。返回 {ok, count, error} */
  function importJSON(json) {
    var result = { ok: false, count: 0, error: '' };
    var parsed;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      result.error = 'invalid-json';
      return result;
    }
    var data = parsed && parsed.data && typeof parsed.data === 'object' ? parsed.data : null;
    if (!data) {
      /* 兼容：直接传对象（无外壳） */
      if (parsed && typeof parsed === 'object') data = parsed;
    }
    if (!data) { result.error = 'no-data'; return result; }
    var count = 0;
    try {
      Object.keys(data).forEach(function (k) {
        if (k.indexOf(PREFIX) !== 0) return; // 只写白名单
        localStorage.setItem(k, String(data[k]));
        count++;
      });
    } catch (e) {
      result.error = 'storage-error';
      return result;
    }
    result.ok = true;
    result.count = count;
    return result;
  }

  /* 全量清空存档（arcade_* 键） */
  function wipe() {
    var removed = 0;
    try {
      var keys = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(PREFIX) === 0) keys.push(k);
      }
      keys.forEach(function (k) { localStorage.removeItem(k); removed++; });
    } catch (e) {}
    return removed;
  }

  return { exportJSON: exportJSON, download: download, importJSON: importJSON, wipe: wipe, VERSION: VERSION };
})();
