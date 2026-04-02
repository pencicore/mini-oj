(function () {
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  var warnEl = document.getElementById("admin-warn");
  try {
    var raw = localStorage.getItem("user");
    if (!raw) {
      warnEl.style.display = "block";
      warnEl.innerHTML =
        "未登录可浏览列表；修改题目请先 <a href=\"login.html\">登录</a>（写接口需管理员权限）。";
    } else {
      var u = JSON.parse(raw);
      var t = (u.userTpye || u.userType || "").toLowerCase();
      if (t !== "admin") {
        warnEl.style.display = "block";
        warnEl.innerHTML =
          "当前账号为 <strong>" +
          escapeHtml(u.userTpye || "user") +
          "</strong>。保存修改需 <strong>admin</strong> 并在数据库中设置 <code>user_tpye=admin</code> 后重新登录。";
      }
    }
  } catch (e) {
    warnEl.style.display = "block";
    warnEl.textContent = "无法读取本地登录信息。";
  }

  var root = document.getElementById("problem-list");
  authFetch(apiUrl("/problemDetails/page?page=1&size=100"))
    .then(function (r) {
      if (!r.ok) throw new Error("请求失败 " + r.status);
      return r.json();
    })
    .then(function (rows) {
      if (!rows || !rows.length) {
        root.innerHTML = '<div class="empty">暂无题目</div>';
        return;
      }
      var html =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        '<th>#</th><th>标题</th><th>时间限制</th><th>内存限制</th>' +
        "</tr></thead><tbody>";
      rows.forEach(function (p) {
        html +=
          '<tr><td class="cell-num">' +
          escapeHtml(String(p.id)) +
          '</td><td><a class="title-link" href="problem-edit.html?id=' +
          encodeURIComponent(String(p.id)) +
          '">' +
          escapeHtml(p.title || "") +
          "</a></td><td>" +
          (p.timeLimit != null ? escapeHtml(String(p.timeLimit)) + " ms" : "—") +
          "</td><td>" +
          (p.memoryLimit != null ? escapeHtml(String(p.memoryLimit)) + " MB" : "—") +
          "</td></tr>";
      });
      html += "</tbody></table></div>";
      root.innerHTML = html;
    })
    .catch(function (e) {
      root.innerHTML =
        '<div class="form-error">加载失败：' + escapeHtml(e.message) + "</div>";
    });
})();
