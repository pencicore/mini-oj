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
        '未登录无法创建比赛；请先 <a href="login.html">登录</a>（创建接口需携带 token）。';
    } else {
      var u = JSON.parse(rawUser);
      if (!isAdminUser(u)) {
        warnEl.style.display = "block";
        warnEl.innerHTML =
          "当前账号非管理员。创建比赛需数据库中 <code>user_tpye=admin</code> 后重新登录。";
      }
    }
  } catch (e) {
    warnEl.style.display = "block";
    warnEl.textContent = "无法读取本地登录信息。";
  }

  function localDateTimeToIso(s) {
    if (!s || typeof s !== "string") return null;
    var t = s.trim();
    if (t.length === 16) {
      return t + ":00";
    }
    return t;
  }

  function parseProblemIds(text) {
    if (text == null || String(text).trim() === "") return [];
    return String(text)
      .split(/[,，\s]+/)
      .map(function (x) {
        return x.trim();
      })
      .filter(function (x) {
        return x.length > 0;
      })
      .map(function (x) {
        var n = Number(x);
        if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
          throw new Error("题目 ID 须为正整数：" + x);
        }
        return n;
      });
  }

  var listRoot = document.getElementById("contest-list");
  var formMsg = document.getElementById("contest-form-msg");

  function showFormMsg(kind, text) {
    formMsg.style.display = "block";
    formMsg.className =
      kind === "error" ? "form-error" : kind === "ok" ? "form-success" : "form-msg";
    formMsg.textContent = text;
  }

  function renderList(rows) {
    if (!rows || !rows.length) {
      listRoot.innerHTML = '<div class="empty">暂无比赛，可在上方表单新建。</div>';
      return;
    }
    var html =
      '<div class="table-wrap"><table class="data-table"><thead><tr>' +
      "<th>#</th><th>标题</th><th>开始</th><th>结束</th><th>封榜</th><th>题目数</th>" +
      "</tr></thead><tbody>";
    rows.forEach(function (c) {
      var n = c.problemIds != null ? c.problemIds.length : 0;
      html +=
        "<tr><td class=\"cell-num\">" +
        escapeHtml(String(c.id)) +
        '</td><td>' +
        escapeHtml(c.title || "") +
        "</td><td>" +
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

  var form = document.getElementById("contest-create-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      formMsg.style.display = "none";
      var title = (document.getElementById("contest-title").value || "").trim();
      var startRaw = document.getElementById("contest-start").value;
      var endRaw = document.getElementById("contest-end").value;
      var freezeRaw = document.getElementById("contest-freeze").value;
      var problemsRaw = document.getElementById("contest-problems").value;

      var body = {
        title: title,
        startTime: localDateTimeToIso(startRaw),
        endTime: localDateTimeToIso(endRaw),
        problemIds: [],
      };
      if (freezeRaw && String(freezeRaw).trim() !== "") {
        body.freezeTime = localDateTimeToIso(freezeRaw);
      } else {
        body.freezeTime = null;
      }
      try {
        body.problemIds = parseProblemIds(problemsRaw);
      } catch (err) {
        showFormMsg("error", err.message);
        return;
      }

      authFetch(API.contestsCreate(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(function (r) {
          if (r.status === 401) {
            throw new Error("未登录或 token 无效，请重新登录。");
          }
          if (!r.ok) {
            return r.text().then(function (t) {
              throw new Error(t || "创建失败 " + r.status);
            });
          }
          return r.json();
        })
        .then(function () {
          showFormMsg("ok", "创建成功。");
          form.reset();
          loadList();
        })
        .catch(function (err) {
          showFormMsg("error", err.message || String(err));
        });
    });
  }

  loadList();
})();
