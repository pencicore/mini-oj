(function () {
  function escapeHtml(s) {
    if (s == null) return "";
    const div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function guestAuthHtml() {
    var page = document.body && document.body.getAttribute("data-page");
    if (page === "login") {
      return (
        '<a href="login.html" class="nav-active" aria-current="page">登录</a>' +
        '<a href="register.html" class="btn-nav">注册</a>'
      );
    }
    if (page === "register") {
      return (
        '<a href="login.html">登录</a>' +
        '<a href="register.html" class="btn-nav nav-active" aria-current="page">注册</a>'
      );
    }
    return (
      '<a href="login.html">登录</a>' + '<a href="register.html" class="btn-nav">注册</a>'
    );
  }

  function renderNavAuth() {
    const el = document.getElementById("nav-auth");
    if (!el) return;
    const raw = localStorage.getItem("user");
    if (!raw) {
      el.innerHTML = guestAuthHtml();
      return;
    }
    try {
      const u = JSON.parse(raw);
      const name = escapeHtml(u.username || "用户");
      el.innerHTML =
        '<span class="nav-user">你好，<strong>' +
        name +
        '</strong></span>' +
        '<a href="#" id="nav-logout">退出</a>';
      const logout = document.getElementById("nav-logout");
      if (logout) {
        logout.addEventListener("click", function (e) {
          e.preventDefault();
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          window.location.href = "index.html";
        });
      }
    } catch (e) {
      el.innerHTML = guestAuthHtml();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderNavAuth);
  } else {
    renderNavAuth();
  }
})();
