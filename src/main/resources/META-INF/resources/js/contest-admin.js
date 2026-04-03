(function () {
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function isAdminUser(u) {
    if (!u || typeof u !== "object") return false;
    var t = (u.userTpye || u.userType || "").toLowerCase();
    return t === "admin";
  }

  var warnEl = document.getElementById("admin-warn");
  try {
    var rawUser = localStorage.getItem("user");
    if (!rawUser) {
      warnEl.style.display = "block";
      warnEl.innerHTML =
        '未登录无法管理比赛；请先 <a href="login.html">登录</a>（写操作需携带 token）。';
    } else {
      var u = JSON.parse(rawUser);
      if (!isAdminUser(u)) {
        warnEl.style.display = "block";
        warnEl.innerHTML =
          "当前账号非管理员。比赛管理需数据库中 <code>user_tpye=admin</code> 后重新登录。";
      }
    }
  } catch (e) {
    warnEl.style.display = "block";
    warnEl.textContent = "无法读取本地登录信息。";
  }

  var listRoot = document.getElementById("contest-list");

  function renderList(rows) {
    if (!rows || !rows.length) {
      listRoot.innerHTML =
        '<div class="empty">暂无比赛。请点击右上角「<a class="title-link" href="contest-create.html">新增比赛</a>」创建。</div>';
      return;
    }
    var html =
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      "<th>#</th><th>标题</th><th>开始</th><th>结束</th><th>封榜</th><th>题目数</th>" +
      "</tr></thead><tbody>";
    rows.forEach(function (c) {
      var n = c.problemIds != null ? c.problemIds.length : 0;
      var idStr = c.id != null ? String(c.id) : "";
      html +=
        "<tr><td class=\"cell-num\">" +
        escapeHtml(idStr) +
        '</td><td><a class="title-link" href="contest-detail.html?id=' +
        encodeURIComponent(idStr) +
        '">' +
        escapeHtml(c.title || "") +
        "</a></td><td>" +
        escapeHtml(formatSubmitTime(c.startTime)) +
        "</td><td>" +
        escapeHtml(formatSubmitTime(c.endTime)) +
        "</td><td>" +
        (c.freezeTime != null ? escapeHtml(formatSubmitTime(c.freezeTime)) : "—") +
        "</td><td>" +
        escapeHtml(String(n)) +
        "</td></tr>";
    });
    html += "</tbody></table></div>";
    listRoot.innerHTML = html;
  }

  function loadList() {
    listRoot.innerHTML =
      '<div class="loading"><span class="loading-spinner" aria-hidden="true"></span>加载中…</div>';
    authFetch(API.contestsPage(1, 100))
      .then(function (r) {
        if (!r.ok) throw new Error("请求失败 " + r.status);
        return r.json();
      })
      .then(renderList)
      .catch(function (e) {
        listRoot.innerHTML =
          '<div class="form-error">加载失败：' + escapeHtml(e.message) + "</div>";
      });
  }

  loadList();
})();
