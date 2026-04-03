(function () {
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function parseId() {
    var q = new URLSearchParams(window.location.search);
    var id = q.get("id");
    if (!id || !/^\d+$/.test(String(id).trim())) return null;
    return String(id).trim();
  }

  function problemLabel(i) {
    if (i < 26) {
      return String.fromCharCode(65 + i);
    }
    return "P" + (i + 1);
  }

  var root = document.getElementById("contest-detail-root");
  var cid = parseId();

  if (!cid) {
    root.innerHTML =
      '<div class="form-error">缺少比赛 id，请从 <a href="contests.html">比赛列表</a> 进入。</div>';
    return;
  }

  authFetch(API.contestById(cid))
    .then(function (r1) {
      if (r1.status === 404) {
        throw new Error("比赛不存在。");
      }
      if (!r1.ok) throw new Error("加载比赛失败 " + r1.status);
      return r1.json();
    })
    .then(function (contest) {
      var title = (contest && contest.title) || "比赛";
      document.title = title + " — Mini OJ";

      var html = "";
      html +=
        '<header class="page-header page-header--with-action">' +
        '<div class="page-header-text">' +
        '<h1 class="page-title">' +
        escapeHtml(title) +
        "</h1>" +
        '<p class="page-desc">比赛信息与题目入口；排名请查看排行榜。</p>' +
        "</div>" +
        '<a href="contest-standings.html?id=' +
        encodeURIComponent(cid) +
        '" class="btn-submit-code">排行榜</a>' +
        "</header>" +
        '<article class="detail-card">' +
        '<div class="meta-row"><span>开始 ' +
        escapeHtml(formatSubmitTime(contest.startTime)) +
        "</span><span>结束 " +
        escapeHtml(formatSubmitTime(contest.endTime)) +
        "</span></div>";
      if (contest.freezeTime != null) {
        html +=
          '<div class="meta-row"><span>封榜 ' +
          escapeHtml(formatSubmitTime(contest.freezeTime)) +
          "</span></div>";
      }
      html += "</article>";

      var pids =
        contest.problemIds != null && contest.problemIds.length
          ? contest.problemIds
          : [];
      if (pids.length) {
        html +=
          '<section class="detail-card" style="margin-top:1rem">' +
          '<h2 class="code-panel-title">题目</h2><ul class="contest-problem-links">';
        pids.forEach(function (pid, i) {
          html +=
            '<li><a class="title-link" href="problem-detail.html?id=' +
            encodeURIComponent(String(pid)) +
            "&contestId=" +
            encodeURIComponent(String(cid)) +
            '">' +
            escapeHtml(problemLabel(i)) +
            " — 题目 #" +
            escapeHtml(String(pid)) +
            "</a></li>";
        });
        html += "</ul></section>";
      }

      root.innerHTML = html;
    })
    .catch(function (e) {
      root.innerHTML =
        '<div class="form-error">' + escapeHtml(e.message || String(e)) + "</div>";
    });
})();
