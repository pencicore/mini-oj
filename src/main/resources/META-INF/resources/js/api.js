(function (global) {
  /** 后端 API 根地址（Quarkus 默认端口 8080） */
  global.API_BASE = "http://localhost:8080";

  /** 拼接 API 路径，path 须以 / 开头 */
  global.apiUrl = function (path) {
    if (!path) {
      return global.API_BASE;
    }
    var p = path.charAt(0) === "/" ? path : "/" + path;
    return global.API_BASE + p;
  };

  /**
   * 与 fetch 相同，但若 localStorage 中存在登录 token，则自动附加
   * Authorization: Bearer &lt;token&gt;
   */
  global.authFetch = function (url, options) {
    options = options || {};
    var headers = {};
    if (options.headers) {
      if (typeof Headers !== "undefined" && options.headers instanceof Headers) {
        options.headers.forEach(function (value, key) {
          headers[key] = value;
        });
      } else if (typeof options.headers === "object") {
        for (var k in options.headers) {
          if (Object.prototype.hasOwnProperty.call(options.headers, k)) {
            headers[k] = options.headers[k];
          }
        }
      }
    }
    try {
      var token = localStorage.getItem("token");
      if (token) {
        headers["Authorization"] = "Bearer " + token;
      }
    } catch (e) {}
    return fetch(url, Object.assign({}, options, { headers: headers }));
  };
})(typeof window !== "undefined" ? window : this);
