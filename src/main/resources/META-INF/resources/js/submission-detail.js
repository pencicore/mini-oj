(function () {
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function statusPillClass(st) {
    var u = String(st || "").toUpperCase();
    if (u === "PENDING") return "status-pending";
    if (u === "AC" || u.indexOf("ACCEPT") >= 0) return "status-ac";
    return "status-wa";
  }

  function testCaseStatusClass(st) {
    var u = String(st || "").toUpperCase();
    if (u === "AC") return "status-ac";
    if (u === "WA") return "status-wa";
    if (u === "TLE") return "status-tle";
    if (u === "RE") return "status-re";
    if (u === "CE") return "status-ce";
    return "status-wa";
  }

  function formatTimeMs(ms) {
    if (ms == null) return "—";
    return String(ms) + " ms";
  }

  function formatMem(bytes) {
    if (bytes == null) return "—";
    var b = Number(bytes);
    if (isNaN(b)) return "—";
    if (b >= 1048576) return (b / 1048576).toFixed(2) + " MB";
    if (b >= 1024) return (b / 1024).toFixed(1) + " KB";
    return String(b) + " B";
  }

  function buildTestResultsHtml(results, sampleMap) {
    if (!results || !results.length) {
      return (
        '<section class="test-results-section">' +
        '<h2 class="test-results-title">测试点结果</h2>' +
        '<p class="test-results-hint">暂无单点数据（可能仍在评测中，或尚未写入数据库）。</p>' +
        "</section>"
      );
    }

    var sorted = results.slice().sort(function (a, b) {
      var x = a.testSampleId != null ? a.testSampleId : 0;
      var y = b.testSampleId != null ? b.testSampleId : 0;
      return x - y;
    });

    var rows = "";
    sorted.forEach(function (tr, i) {
      var sp = tr.testSampleId != null ? sampleMap[tr.testSampleId] : null;
      var inputText = sp && sp.input != null ? sp.input : "—";
      var expText = sp && sp.expectedOutput != null ? sp.expectedOutput : "—";
      var actText = tr.actualOutput != null ? tr.actualOutput : "—";
      var pill = testCaseStatusClass(tr.status);

      rows +=
        "<tr>" +
        '<td class="cell-shrink">' +
        (i + 1) +
        "</td>" +
        '<td class="cell-shrink">' +
        escapeHtml(String(tr.testSampleId != null ? tr.testSampleId : "—")) +
        "</td>" +
        '<td class="cell-shrink"><span class="status-pill ' +
        pill +
        '">' +
        escapeHtml(tr.status || "—") +
        "</span></td>" +
        '<td class="cell-shrink">' +
        escapeHtml(formatTimeMs(tr.timeUsed)) +
        "</td>" +
        '<td class="cell-shrink">' +
        escapeHtml(formatMem(tr.memoryUsed)) +
        "</td>" +
        "<td><pre class=\"sample-io-pre\">" +
        escapeHtml(inputText) +
        "</pre></td>" +
        "<td><pre class=\"sample-io-pre\">" +
        escapeHtml(expText) +
        "</pre></td>" +
        "<td><pre class=\"sample-io-pre actual\">" +
        escapeHtml(actText) +
        "</pre></td>" +
        "</tr>";
    });

    return (
      '<section class="test-results-section">' +
      '<h2 class="test-results-title">测试点结果</h2>' +
      '<p class="test-results-hint">共 ' +
      sorted.length +
      " 个样例；用时为程序运行时间，内存为进程峰值占用。</p>" +
      '<div class="test-results-wrap">' +
      '<table class="test-results-table">' +
      "<thead><tr>" +
      "<th>#</th>" +
      "<th>样例 ID</th>" +
      "<th>状态</th>" +
      "<th>用时</th>" +
      "<th>内存</th>" +
      "<th>输入</th>" +
      "<th>期望输出</th>" +
      "<th>实际输出</th>" +
      "</tr></thead><tbody>" +
      rows +
      "</tbody></table></div></section>"
    );
  }

  function renderCard(s, results, samples) {
    document.title = "提交 #" + escapeHtml(String(s.id)) + " — Mini OJ";

    var st = s.status || "";
    var pillClass = statusPillClass(st);

    var sampleMap = {};
    (samples || []).forEach(function (sp) {
      if (sp && sp.id != null) {
        sampleMap[sp.id] = sp;
      }
    });

    var testHtml = buildTestResultsHtml(results, sampleMap);

    var root = document.getElementById("submission-detail");
    root.innerHTML =
      '<article class="submission-detail-card">' +
      '<h1 class="submission-detail-title">提交 #' +
      escapeHtml(String(s.id)) +
      "</h1>" +
      '<dl class="submission-meta-grid">' +
      "<dt>题目</dt><dd><a href=\"problem-detail.html?id=" +
      encodeURIComponent(String(s.problemId)) +
      '">#' +
      escapeHtml(String(s.problemId)) +
      "</a></dd>" +
      "<dt>语言</dt><dd>" +
      escapeHtml(s.language || "—") +
      "</dd>" +
      "<dt>状态</dt><dd><span class=\"status-pill " +
      pillClass +
      '">' +
      escapeHtml(st || "—") +
      "</span></dd>" +
      "<dt>提交时间</dt><dd>" +
      escapeHtml(s.submitTime || "—") +
      "</dd>" +
      "<dt>用户 ID</dt><dd>" +
      escapeHtml(String(s.userId != null ? s.userId : "—")) +
      "</dd>" +
      "</dl>" +
      testHtml +
      '<p class="submission-code-label">源代码</p>' +
      '<pre class="submission-code-block" id="submission-code-pre"></pre>' +
      "</article>";

    var pre = document.getElementById("submission-code-pre");
    pre.textContent = s.code != null ? s.code : "";
  }

  var params = new URLSearchParams(window.location.search);
  var sid = params.get("id");
  var root = document.getElementById("submission-detail");

  if (!sid) {
    root.innerHTML = '<div class="form-error">缺少提交记录 id</div>';
    return;
  }

  authFetch(apiUrl("/userCodeSubmissions/" + encodeURIComponent(sid)))
    .then(function (r) {
      if (r.status === 401) {
        root.innerHTML =
          '<div class="form-error">请先 <a href="login.html">登录</a> 后查看自己的提交记录。</div>';
        return null;
      }
      if (r.status === 404) {
        root.innerHTML =
          '<div class="form-error">记录不存在或无权查看（只能查看本人提交）。</div>';
        return null;
      }
      if (!r.ok) throw new Error("请求失败 " + r.status);
      return r.json();
    })
    .then(function (s) {
      if (!s) return;
      return Promise.all([
        authFetch(
          apiUrl("/userCodeSubmissions/" + encodeURIComponent(sid) + "/testResults")
        ).then(function (r) {
          if (!r.ok) return [];
          return r.json();
        }),
        authFetch(
          apiUrl("/problemTestSamples/problem/" + encodeURIComponent(String(s.problemId)))
        ).then(function (r) {
          if (!r.ok) return [];
          return r.json();
        }),
      ]).then(function (pairs) {
        renderCard(s, pairs[0], pairs[1]);
      });
    })
    .catch(function (e) {
      root.innerHTML =
        '<div class="form-error">加载失败：' + escapeHtml(e.message) + "</div>";
    });
})();
