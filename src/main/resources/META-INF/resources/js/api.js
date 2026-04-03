(function (global) {
  /** 后端 API 根地址（Quarkus 默认端口 8080） */
  global.API_BASE = "http://localhost:8080";

  /**
   * REST 相对路径（不含域名），以 / 开头。
   * 后端路由变更时只改此处。
   */
  var PATHS = {
    USERS_LOGIN: "/users/login",
    USERS_REGISTER: "/users/register",
    PROBLEM_DETAILS: "/problemDetails",
    PROBLEM_DETAILS_PAGE: "/problemDetails/page",
    PROBLEM_TEST_SAMPLES: "/problemTestSamples",
    USER_CODE_SUBMISSIONS: "/userCodeSubmissions",
  };

  /** 拼接完整 URL，path 须以 / 开头（低层方法；业务代码请优先用 API.*） */
  global.apiUrl = function (path) {
    if (!path) {
      return global.API_BASE;
    }
    var p = path.charAt(0) === "/" ? path : "/" + path;
    return global.API_BASE + p;
  };

  /** 统一 API 地址构造（与 PATHS 对应） */
  global.API = {
    paths: PATHS,
    usersLogin: function () {
      return global.apiUrl(PATHS.USERS_LOGIN);
    },
    usersRegister: function () {
      return global.apiUrl(PATHS.USERS_REGISTER);
    },
    problemDetailsPage: function (page, size) {
      return global.apiUrl(
        PATHS.PROBLEM_DETAILS_PAGE +
          "?page=" +
          encodeURIComponent(String(page)) +
          "&size=" +
          encodeURIComponent(String(size))
      );
    },
    problemDetail: function (id) {
      return global.apiUrl(
        PATHS.PROBLEM_DETAILS + "/" + encodeURIComponent(String(id))
      );
    },
    /** POST 新建题目 */
    problemDetailsCreate: function () {
      return global.apiUrl(PATHS.PROBLEM_DETAILS);
    },
    userCodeSubmissionsPage: function (page, size) {
      return global.apiUrl(
        PATHS.USER_CODE_SUBMISSIONS +
          "/page?page=" +
          encodeURIComponent(String(page)) +
          "&size=" +
          encodeURIComponent(String(size))
      );
    },
    userCodeSubmission: function (id) {
      return global.apiUrl(
        PATHS.USER_CODE_SUBMISSIONS + "/" + encodeURIComponent(String(id))
      );
    },
    userCodeSubmissionTestResults: function (id) {
      return global.apiUrl(
        PATHS.USER_CODE_SUBMISSIONS +
          "/" +
          encodeURIComponent(String(id)) +
          "/testResults"
      );
    },
    /** POST 提交代码 */
    userCodeSubmissionsCreate: function () {
      return global.apiUrl(PATHS.USER_CODE_SUBMISSIONS);
    },
    problemTestSamplesByProblem: function (problemId) {
      return global.apiUrl(
        PATHS.PROBLEM_TEST_SAMPLES +
          "/problem/" +
          encodeURIComponent(String(problemId))
      );
    },
    problemTestSample: function (sampleId) {
      return global.apiUrl(
        PATHS.PROBLEM_TEST_SAMPLES + "/" + encodeURIComponent(String(sampleId))
      );
    },
    /** POST 新建测试样例 */
    problemTestSamplesCreate: function () {
      return global.apiUrl(PATHS.PROBLEM_TEST_SAMPLES);
    },
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

  /**
   * 将后端 LocalDateTime 序列化字符串格式化为易读中文时间（浏览器本地日历日）。
   * 例：今天 14:30、昨天 09:05、4月3日 14:30、2025年4月3日 14:30
   */
  global.formatSubmitTime = function (raw) {
    if (raw == null || raw === "") {
      return "—";
    }
    var s = String(raw).trim();
    var m =
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?/.exec(
        s
      );
    if (!m) {
      return s;
    }
    var y = Number(m[1]);
    var mo = Number(m[2]) - 1;
    var d = Number(m[3]);
    var h = Number(m[4]);
    var mi = Number(m[5]);
    var sec = m[6] != null && m[6] !== "" ? Number(m[6]) : 0;
    var dt = new Date(y, mo, d, h, mi, sec);
    if (isNaN(dt.getTime())) {
      return s;
    }
    var pad = function (n) {
      return n < 10 ? "0" + n : "" + n;
    };
    var hhmm = pad(h) + ":" + pad(mi);
    var now = new Date();
    var startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var startThat = new Date(y, mo, d);
    var diffDays = Math.round((startToday - startThat) / 86400000);
    if (diffDays === 0) {
      return "今天 " + hhmm;
    }
    if (diffDays === 1) {
      return "昨天 " + hhmm;
    }
    if (y === now.getFullYear()) {
      return mo + 1 + "月" + d + "日 " + hhmm;
    }
    return y + "年" + (mo + 1) + "月" + d + "日 " + hhmm;
  };
})(typeof window !== "undefined" ? window : this);
