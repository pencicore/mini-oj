(function () {
  var MONACO_VER = "0.52.0";
  var MONACO_BASE =
    "https://cdn.jsdelivr.net/npm/monaco-editor@" + MONACO_VER + "/min/vs";

  var STUBS = {
    python: "# 在此编写代码\n",
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n",
    java: 'public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n',
  };

  var LANG_KEY = { python: "python", cpp: "cpp", java: "java" };

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function readIsExample(s) {
    if (s == null) return false;
    if (typeof s.isExample === "boolean") return s.isExample;
    if (typeof s.example === "boolean") return s.example;
    return !!s.isExample;
  }

  function buildExamplesSection(samples) {
    if (!samples || !samples.length) {
      return "";
    }
    var sorted = samples.slice().sort(function (a, b) {
      var x = a.id != null ? a.id : 0;
      var y = b.id != null ? b.id : 0;
      return x - y;
    });
    var blocks = "";
    sorted.forEach(function (s, i) {
      var inn = s.input != null ? s.input : "";
      var out = s.expectedOutput != null ? s.expectedOutput : "";
      blocks +=
        '<div class="problem-example-item">' +
        '<h3 class="problem-example-title">样例 ' +
        (i + 1) +
        "</h3>" +
        '<div class="sample-io-row">' +
        '<div class="form-group problem-example-io">' +
        "<label>输入</label>" +
        '<pre class="sample-io-pre">' +
        escapeHtml(inn) +
        "</pre></div>" +
        '<div class="form-group problem-example-io">' +
        "<label>输出</label>" +
        '<pre class="sample-io-pre">' +
        escapeHtml(out) +
        "</pre></div>" +
        "</div></div>";
    });
    return (
      '<section class="detail-card problem-examples-card">' +
      '<h2 class="code-panel-title">样例</h2>' +
      '<p class="problem-examples-hint">以下为管理员设置为「题目页展示」的样例。</p>' +
      blocks +
      "</section>"
    );
  }

  var monacoLoading = false;
  function loadMonaco(callback) {
    if (typeof window.monaco !== "undefined" && window.monaco.editor) {
      callback();
      return;
    }
    if (monacoLoading) {
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (typeof window.monaco !== "undefined" && window.monaco.editor) {
          clearInterval(t);
          callback();
        } else if (tries > 200) {
          clearInterval(t);
        }
      }, 30);
      return;
    }
    monacoLoading = true;
    var s = document.createElement("script");
    s.src = MONACO_BASE + "/loader.js";
    s.onload = function () {
      require.config({ paths: { vs: MONACO_BASE } });
      require(["vs/editor/editor.main"], function () {
        monacoLoading = false;
        callback();
      });
    };
    s.onerror = function () {
      monacoLoading = false;
      root.innerHTML =
        '<div class="form-error">Monaco Editor 脚本加载失败，请检查网络或稍后重试。</div>';
    };
    document.head.appendChild(s);
  }

  function renderPage(problem, exampleSamples) {
    var examplesHtml = buildExamplesSection(exampleSamples);
    return (
      '<article class="detail-card">' +
      '<h1 class="detail-title">' +
      escapeHtml(problem.title || "") +
      "</h1>" +
      '<div class="meta-row"><span>时间限制 ' +
      (problem.timeLimit != null ? problem.timeLimit + " ms" : "—") +
      "</span><span>内存 " +
      (problem.memoryLimit != null ? problem.memoryLimit + " MB" : "—") +
      "</span></div>" +
      '<div class="problem-body">' +
      escapeHtml(problem.content || "（无描述）") +
      "</div></article>" +
      examplesHtml +
      '<section class="detail-card code-panel">' +
      '<h2 class="code-panel-title">代码编辑</h2>' +
      '<div class="editor-toolbar">' +
      '<label for="code-lang">语言</label>' +
      '<select id="code-lang" aria-label="选择语言">' +
      '<option value="python" selected>Python 3</option>' +
      '<option value="cpp">C++</option>' +
      '<option value="java">Java</option>' +
      "</select>" +
      '<span class="toolbar-spacer" aria-hidden="true"></span>' +
      '<button type="button" class="btn-submit-code" id="btn-submit-code">提交评测</button>' +
      "</div>" +
      '<div id="monaco-host" class="monaco-host" role="region" aria-label="代码编辑器"></div>' +
      '<div id="submit-msg"></div>' +
      "</section>"
    );
  }

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var root = document.getElementById("detail");

  if (!id) {
    root.innerHTML = '<div class="form-error">缺少题目 id</div>';
    return;
  }

  Promise.all([
    authFetch(API.problemDetail(id)).then(function (r) {
      if (r.status === 404) throw new Error("题目不存在");
      if (!r.ok) throw new Error("请求失败 " + r.status);
      return r.json();
    }),
    authFetch(
      API.problemTestSamplesByProblem(id)
    ).then(function (r) {
      if (!r.ok) return [];
      return r.json();
    }),
  ])
    .then(function (tuple) {
      var p = tuple[0];
      var allSamples = tuple[1] || [];
      var exampleSamples = allSamples.filter(readIsExample);
      document.title = escapeHtml(p.title || "题目") + " — Mini OJ";
      root.innerHTML = renderPage(p, exampleSamples);

      var langSelect = document.getElementById("code-lang");
      var host = document.getElementById("monaco-host");
      var btn = document.getElementById("btn-submit-code");
      var msgEl = document.getElementById("submit-msg");

      loadMonaco(function () {
        var key = langSelect.value || "python";
        var editor = monaco.editor.create(host, {
          value: STUBS[key],
          language: LANG_KEY[key],
          theme: "vs",
          automaticLayout: true,
          minimap: { enabled: true },
          fontSize: 14,
          tabSize: 4,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          renderLineHighlight: "all",
          padding: { top: 12, bottom: 12 },
        });

        langSelect.addEventListener("change", function () {
          var k = langSelect.value;
          monaco.editor.setModelLanguage(editor.getModel(), LANG_KEY[k]);
          editor.setValue(STUBS[k]);
        });

        window.addEventListener("resize", function () {
          editor.layout();
        });

        btn.addEventListener("click", function () {
          msgEl.innerHTML = "";
          var k = langSelect.value;
          var body = {
            problemId: Number(id),
            code: editor.getValue(),
            language: LANG_KEY[k],
          };
          btn.disabled = true;
          authFetch(API.userCodeSubmissionsCreate(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
            .then(function (r) {
              return r.text().then(function (text) {
                var data;
                try {
                  data = text ? JSON.parse(text) : null;
                } catch (e) {
                  data = text;
                }
                return { ok: r.ok, status: r.status, data: data };
              });
            })
            .then(function (res) {
              btn.disabled = false;
              if (res.status === 401) {
                msgEl.innerHTML =
                  '<div class="form-error">请先 <a href="login.html">登录</a> 后再提交。</div>';
                return;
              }
              if (!res.ok) {
                var err =
                  typeof res.data === "string"
                    ? res.data
                    : res.data && res.data.message
                      ? res.data.message
                      : "提交失败（" + res.status + "）";
                msgEl.innerHTML = '<div class="form-error">' + escapeHtml(err) + "</div>";
                return;
              }
              var detailLink = "";
              if (res.data && typeof res.data === "object" && res.data.id != null) {
                detailLink =
                  ' <a href="submission-detail.html?id=' +
                  encodeURIComponent(String(res.data.id)) +
                  '">查看提交详情</a>';
              }
              msgEl.innerHTML =
                '<div class="form-success">提交成功，评测排队中。' +
                detailLink +
                ' 也可到 <a href="history.html">提交历史</a> 查看全部记录。</div>';
            })
            .catch(function (e) {
              btn.disabled = false;
              msgEl.innerHTML =
                '<div class="form-error">网络错误：' +
                escapeHtml(e.message || "") +
                "</div>";
            });
        });
      });
    })
    .catch(function (e) {
      root.innerHTML = '<div class="form-error">' + escapeHtml(e.message) + "</div>";
    });
})();
