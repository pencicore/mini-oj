(function () {
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  var root = document.getElementById("contest-list-root");

  function contestPhase(startRaw, endRaw) {
    if (!startRaw || !endRaw) return "—";
    var m1 =
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(startRaw));
    var m2 =
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(endRaw));
    if (!m1 || !m2) return "—";
    var t1 = new Date(
      Number(m1[1]),
      Number(m1[2]) - 1,
      Number(m1[3]),
      Number(m1[4]),
      Number(m1[5]),
      0
    );
    var t2 = new Date(
      Number(m2[1]),
      Number(m2[2]) - 1,
      Number(m2[3]),
      Number(m2[4]),
      Number(m2[5]),
      0
    );
    var now = Date.now();
    if (now < t1.getTime()) return "未开始";
    if (now > t2.getTime()) return "已结束";
    return "进行中";
  }

  authFetch(API.contestsPage(1, 100))
    .then(function (r) {
      if (!r.ok) throw new Error("请求失败 " + r.status);
      return r.json();
    })
    .then(function (rows) {
      if (!rows || !rows.length) {
        root.innerHTML = '<div class="empty">暂无比赛。</div>';
        return;
      }
      var html =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>#</th><th>标题</th><th>开始</th><th>结束</th><th>状态</th><th>题目数</th><th>排行榜</th>" +
        "</tr></thead><tbody>";
      rows.forEach(function (c) {
        var n = c.problemIds != null ? c.problemIds.length : 0;
        var title = escapeHtml(c.title || "");
        var id = c.id != null ? String(c.id) : "";
        html +=
          '<tr><td class="cell-num">' +
          escapeHtml(id) +
          '</td><td><a class="title-link" href="contest-detail.html?id=' +
          encodeURIComponent(id) +
          '">' +
          title +
          "</a></td><td>" +
          escapeHtml(formatSubmitTime(c.startTime)) +
          "</td><td>" +
          escapeHtml(formatSubmitTime(c.endTime)) +
          "</td><td>" +
          escapeHtml(contestPhase(c.startTime, c.endTime)) +
          "</td><td>" +
          escapeHtml(String(n)) +
          '</td><td><a class="title-link" href="contest-standings.html?id=' +
          encodeURIComponent(id) +
          '">查看</a></td></tr>';
      });
      html += "</tbody></table></div>";
      root.innerHTML = html;
    })
    .catch(function (e) {
      root.innerHTML =
        '<div class="form-error">加载失败：' + escapeHtml(e.message) + "</div>";
    });
})();
