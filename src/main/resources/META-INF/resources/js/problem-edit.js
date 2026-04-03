(function () {
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

  var params = new URLSearchParams(window.location.search);
  var pid = params.get("id");
  var root = document.getElementById("edit-root");
  var wantsNew =
    params.get("new") === "1" || params.get("new") === "true";
  var hasValidId =
    pid != null && String(pid).trim() !== "" && !isNaN(Number(pid));
  var problemIdNum = hasValidId ? Number(pid) : NaN;

  function renderCreateForm() {
    document.title = "新增题目 — Mini OJ";
    root.innerHTML =
      '<div class="edit-page">' +
      '<header class="edit-page-head">' +
      '<h1 class="edit-page-title">新增题目</h1>' +
      '<p class="edit-page-meta">保存后将进入编辑页，可继续添加测试样例。</p>' +
      "</header>" +
      '<div class="edit-layout edit-layout--create">' +
      '<div class="edit-col edit-col-problem">' +
      '<article class="detail-card edit-card-problem">' +
      '<h2 class="edit-card-heading">题目信息</h2>' +
      '<form id="problem-create-form">' +
      '<div class="form-group">' +
      '<label for="f-title">标题</label>' +
      '<input id="f-title" name="title" type="text" required />' +
      "</div>" +
      '<div class="form-row-inline">' +
      '<div class="form-group">' +
      '<label for="f-time">时间限制 (ms)</label>' +
      '<input id="f-time" name="timeLimit" type="number" min="1" step="1" />' +
      "</div>" +
      '<div class="form-group">' +
      '<label for="f-mem">内存限制 (MB)</label>' +
      '<input id="f-mem" name="memoryLimit" type="number" min="1" step="1" />' +
      "</div>" +
      "</div>" +
      '<div class="form-group">' +
      '<label for="f-content">题目描述</label>' +
      '<textarea id="f-content" name="content" rows="12" class="edit-textarea edit-textarea--desc"></textarea>' +
      "</div>" +
      '<div class="edit-toolbar">' +
      '<button type="submit" class="btn-submit-code">创建题目</button>' +
      "</div>" +
      '<div id="edit-msg"></div>' +
      "</form>" +
      "</article></div></div></div>";

    var msgEl = document.getElementById("edit-msg");
    document
      .getElementById("problem-create-form")
      .addEventListener("submit", function (e) {
        e.preventDefault();
        msgEl.innerHTML = "";
        var title = document.getElementById("f-title").value.trim();
        if (!title) {
          msgEl.innerHTML = '<div class="form-error">请填写标题</div>';
          return;
        }
        var body = {
          title: title,
          content: document.getElementById("f-content").value,
          timeLimit:
            parseInt(document.getElementById("f-time").value, 10) || null,
          memoryLimit:
            parseInt(document.getElementById("f-mem").value, 10) || null,
        };
        authFetch(API.problemDetailsCreate(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
          .then(function (r) {
            return r.text().then(function (text) {
              var data;
              try {
                data = text ? JSON.parse(text) : null;
              } catch (err) {
                data = text;
              }
              return { ok: r.ok, status: r.status, data: data };
            });
          })
          .then(function (res) {
            if (res.status === 401) {
              msgEl.innerHTML =
                '<div class="form-error">未登录或 token 无效，请先 <a href="login.html">登录</a>。</div>';
              return;
            }
            if (!res.ok) {
              var err =
                typeof res.data === "string"
                  ? res.data
                  : res.data && res.data.message
                    ? res.data.message
                    : "创建失败（" + res.status + "）";
              msgEl.innerHTML =
                '<div class="form-error">' + escapeHtml(err) + "</div>";
              return;
            }
            if (!res.data || res.data.id == null) {
              msgEl.innerHTML =
                '<div class="form-error">创建成功但未返回题目 id，请从题库列表进入。</div>';
              return;
            }
            window.location.href =
              "problem-edit.html?id=" +
              encodeURIComponent(String(res.data.id));
          })
          .catch(function (err) {
            msgEl.innerHTML =
              '<div class="form-error">网络错误：' +
              escapeHtml(err.message || "") +
              "</div>";
          });
      });
  }

  if (wantsNew && !hasValidId) {
    renderCreateForm();
    return;
  }

  if (!hasValidId) {
    root.innerHTML =
      '<div class="form-error">缺少题目 id。<a href="problem-edit.html?new=1" class="title-link">新建题目</a></div>';
    return;
  }

  function showSampleMsg(text, isError) {
    var el = document.getElementById("sample-msg");
    if (!el) return;
    if (!text) {
      el.innerHTML = "";
      return;
    }
    var safe = escapeHtml(text);
    el.innerHTML = isError
      ? '<div class="form-error">' + safe + "</div>"
      : '<div class="form-success">' + safe + "</div>";
  }

  function loadSamples() {
    var listEl = document.getElementById("sample-list");
    if (!listEl) return;
    listEl.innerHTML =
      '<div class="loading" style="padding:1.5rem"><span class="loading-spinner"></span> 加载样例…</div>';
    authFetch(API.problemTestSamplesByProblem(problemIdNum))
      .then(function (r) {
        if (!r.ok) throw new Error("请求失败 " + r.status);
        return r.json();
      })
      .then(function (rows) {
        if (!rows || !rows.length) {
          listEl.innerHTML =
            '<p class="muted" style="margin:0;font-size:0.875rem">暂无测试样例，请在上方「新增样例」中添加。</p>';
          return;
        }
        var html = "";
        rows.forEach(function (s) {
          var id = s.id;
          var ex = readIsExample(s);
          html +=
            '<div class="sample-card sample-card--collapsed" data-sample-id="' +
            escapeHtml(String(id)) +
            '">' +
            '<div class="sample-card-bar">' +
            "<span>样例 <strong>#" +
            escapeHtml(String(id)) +
            "</strong></span>" +
            '<label><input type="checkbox" class="sample-cb-example" ' +
            (ex ? "checked " : "") +
            '/> 题目页展示</label>' +
            '<button type="button" class="btn-sample-toggle" data-action="toggle-sample" aria-expanded="false">展开编辑</button>' +
            '<div class="sample-card-actions">' +
            '<button type="button" class="btn-sample-save" data-action="save-sample">保存</button>' +
            '<button type="button" class="btn-sample-del" data-action="del-sample">删除</button>' +
            "</div></div>" +
            '<div class="sample-card-body">' +
            '<div class="sample-io-row">' +
            '<div class="form-group"><label>输入</label>' +
            '<textarea class="edit-textarea sample-field-in" rows="6"></textarea></div>' +
            '<div class="form-group"><label>期望输出</label>' +
            '<textarea class="edit-textarea sample-field-out" rows="6"></textarea></div>' +
            "</div></div></div>";
        });
        listEl.innerHTML = html;
        rows.forEach(function (s, i) {
          var card = listEl.querySelectorAll(".sample-card")[i];
          if (!card) return;
          card.querySelector(".sample-field-in").value = s.input != null ? s.input : "";
          card.querySelector(".sample-field-out").value =
            s.expectedOutput != null ? s.expectedOutput : "";
        });
      })
      .catch(function (e) {
        listEl.innerHTML =
          '<div class="form-error">' + escapeHtml(e.message || "加载失败") + "</div>";
      });
  }

  function bindSampleSection() {
    var section = document.getElementById("sample-section");
    if (!section) return;

    section.addEventListener("click", function (e) {
      var t = e.target;
      if (t.getAttribute("data-action") === "toggle-sample") {
        var cardT = t.closest(".sample-card");
        if (!cardT) return;
        cardT.classList.toggle("sample-card--collapsed");
        var collapsed = cardT.classList.contains("sample-card--collapsed");
        t.textContent = collapsed ? "展开编辑" : "收起";
        t.setAttribute("aria-expanded", collapsed ? "false" : "true");
        if (!collapsed) {
          var ta = cardT.querySelector(".sample-field-in");
          if (ta) ta.focus();
        }
        return;
      }
      if (t.getAttribute("data-action") === "save-sample") {
        var card = t.closest(".sample-card");
        if (!card) return;
        var sid = card.getAttribute("data-sample-id");
        var input = card.querySelector(".sample-field-in").value;
        var out = card.querySelector(".sample-field-out").value;
        var isEx = card.querySelector(".sample-cb-example").checked;
        showSampleMsg("", false);
        authFetch(API.problemTestSample(sid), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemId: problemIdNum,
            input: input,
            expectedOutput: out,
            isExample: isEx,
          }),
        })
          .then(function (r) {
            if (r.status === 401) {
              showSampleMsg("未登录或无权修改样例。", true);
              return;
            }
            if (!r.ok) return r.text().then(function (txt) {
              showSampleMsg(txt || "保存失败", true);
            });
            showSampleMsg("样例 #" + sid + " 已保存", false);
            loadSamples();
          })
          .catch(function (err) {
            showSampleMsg(err.message || "网络错误", true);
          });
      }
      if (t.getAttribute("data-action") === "del-sample") {
        var card2 = t.closest(".sample-card");
        if (!card2) return;
        var sid2 = card2.getAttribute("data-sample-id");
        if (!confirm("确定删除样例 #" + sid2 + "？")) return;
        showSampleMsg("", false);
        authFetch(API.problemTestSample(sid2), { method: "DELETE" })
          .then(function (r) {
            if (r.status === 401) {
              showSampleMsg("未登录或无权删除。", true);
              return;
            }
            if (!r.ok) return r.text().then(function (txt) {
              showSampleMsg(txt || "删除失败", true);
            });
            showSampleMsg("已删除样例 #" + sid2, false);
            loadSamples();
          })
          .catch(function (err) {
            showSampleMsg(err.message || "网络错误", true);
          });
      }
    });

    var btnAdd = document.getElementById("btn-add-sample");
    if (btnAdd) {
      btnAdd.addEventListener("click", function () {
        var input = document.getElementById("new-sample-in");
        var out = document.getElementById("new-sample-out");
        var cb = document.getElementById("new-sample-example");
        if (!input || !out) return;
        showSampleMsg("", false);
        authFetch(API.problemTestSamplesCreate(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemId: problemIdNum,
            input: input.value,
            expectedOutput: out.value,
            isExample: cb ? cb.checked : false,
          }),
        })
          .then(function (r) {
            if (r.status === 401) {
              showSampleMsg("未登录或无权新增样例。", true);
              return;
            }
            if (!r.ok) return r.text().then(function (txt) {
              showSampleMsg(txt || "添加失败", true);
            });
            showSampleMsg("已添加新样例", false);
            input.value = "";
            out.value = "";
            if (cb) cb.checked = false;
            loadSamples();
          })
          .catch(function (err) {
            showSampleMsg(err.message || "网络错误", true);
          });
      });
    }
  }

  function renderForm(p) {
    document.title = "编辑 — " + (p.title || "题目") + " — Mini OJ";
    root.innerHTML =
      '<div class="edit-page">' +
      '<header class="edit-page-head">' +
      '<h1 class="edit-page-title">编辑题目</h1>' +
      '<p class="edit-page-meta">' +
      escapeHtml(p.title || "（无标题）") +
      "</p></header>" +
      '<div class="edit-layout">' +
      '<div class="edit-col edit-col-problem">' +
      '<article class="detail-card edit-card-problem">' +
      '<h2 class="edit-card-heading">题目信息</h2>' +
      '<form id="problem-edit-form">' +
      '<div class="form-group">' +
      '<label for="f-title">标题</label>' +
      '<input id="f-title" name="title" type="text" required />' +
      "</div>" +
      '<div class="form-row-inline">' +
      '<div class="form-group">' +
      '<label for="f-time">时间限制 (ms)</label>' +
      '<input id="f-time" name="timeLimit" type="number" min="1" step="1" />' +
      "</div>" +
      '<div class="form-group">' +
      '<label for="f-mem">内存限制 (MB)</label>' +
      '<input id="f-mem" name="memoryLimit" type="number" min="1" step="1" />' +
      "</div>" +
      "</div>" +
      '<div class="form-group">' +
      '<label for="f-content">题目描述</label>' +
      '<textarea id="f-content" name="content" rows="12" class="edit-textarea edit-textarea--desc"></textarea>' +
      "</div>" +
      '<div class="edit-toolbar">' +
      '<button type="submit" class="btn-submit-code">保存题目</button>' +
      '<button type="button" class="btn-ghost-edit" id="btn-delete">删除题目</button>' +
      "</div>" +
      '<div id="edit-msg"></div>' +
      "</form>" +
      "</article></div>" +
      '<div class="edit-col edit-col-samples">' +
      '<article class="detail-card sample-section" id="sample-section">' +
      '<h2 class="code-panel-title">测试样例</h2>' +
      '<p class="sample-section-intro">' +
      "判题使用本题全部样例；勾选「题目页展示」可在做题页显示为示例。增删改需管理员权限。" +
      "</p>" +
      '<div class="sample-new-block">' +
      "<h3>新增样例</h3>" +
      '<div class="sample-io-row">' +
      '<div class="form-group"><label for="new-sample-in">输入</label>' +
      '<textarea id="new-sample-in" class="edit-textarea" rows="5"></textarea></div>' +
      '<div class="form-group"><label for="new-sample-out">期望输出</label>' +
      '<textarea id="new-sample-out" class="edit-textarea" rows="5"></textarea></div>' +
      "</div>" +
      '<label class="sample-new-check">' +
      '<input type="checkbox" id="new-sample-example" /> 在题目页作为样例展示</label>' +
      '<button type="button" class="btn-sample-add" id="btn-add-sample">添加样例</button>' +
      "</div>" +
      '<p class="sample-list-heading">已有样例</p>' +
      '<p class="sample-list-hint">默认折叠；点击「展开编辑」后再修改输入与输出。</p>' +
      '<div id="sample-list"></div>' +
      '<div id="sample-msg"></div>' +
      "</article></div></div></div>";

    document.getElementById("f-title").value = p.title || "";
    document.getElementById("f-content").value = p.content || "";
    document.getElementById("f-time").value =
      p.timeLimit != null ? String(p.timeLimit) : "";
    document.getElementById("f-mem").value =
      p.memoryLimit != null ? String(p.memoryLimit) : "";

    var msgEl = document.getElementById("edit-msg");

    document.getElementById("problem-edit-form").addEventListener("submit", function (e) {
      e.preventDefault();
      msgEl.innerHTML = "";
      var body = {
        title: document.getElementById("f-title").value.trim(),
        content: document.getElementById("f-content").value,
        timeLimit: parseInt(document.getElementById("f-time").value, 10) || null,
        memoryLimit: parseInt(document.getElementById("f-mem").value, 10) || null,
      };
      authFetch(API.problemDetail(pid), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
        .then(function (r) {
          return r.text().then(function (text) {
            var data;
            try {
              data = text ? JSON.parse(text) : null;
            } catch (err) {
              data = text;
            }
            return { ok: r.ok, status: r.status, data: data };
          });
        })
        .then(function (res) {
          if (res.status === 401) {
            msgEl.innerHTML =
              '<div class="form-error">未登录或 token 无效，请先 <a href="login.html">登录</a>。</div>';
            return;
          }
          if (!res.ok) {
            var err =
              typeof res.data === "string"
                ? res.data
                : res.data && res.data.message
                  ? res.data.message
                  : "保存失败（" + res.status + "）";
            msgEl.innerHTML = '<div class="form-error">' + escapeHtml(err) + "</div>";
            return;
          }
          msgEl.innerHTML = '<div class="form-success">题目已保存</div>';
        })
        .catch(function (err) {
          msgEl.innerHTML =
            '<div class="form-error">网络错误：' + escapeHtml(err.message || "") + "</div>";
        });
    });

    document.getElementById("btn-delete").addEventListener("click", function () {
      if (!confirm("确定删除该题目？其下测试样例也会被一并删除，且不可恢复。")) return;
      msgEl.innerHTML = "";
      authFetch(API.problemDetail(pid), { method: "DELETE" })
        .then(function (r) {
          if (r.status === 401) {
            msgEl.innerHTML =
              '<div class="form-error">未登录或无权删除。</div>';
            return;
          }
          if (!r.ok) {
            return r.text().then(function (t) {
              msgEl.innerHTML =
                '<div class="form-error">' + escapeHtml(t || "删除失败") + "</div>";
            });
          }
          window.location.href = "admin.html";
        })
        .catch(function (err) {
          msgEl.innerHTML =
            '<div class="form-error">' + escapeHtml(err.message || "") + "</div>";
        });
    });

    bindSampleSection();
    loadSamples();
  }

  authFetch(API.problemDetail(pid))
    .then(function (r) {
      if (r.status === 404) {
        root.innerHTML = '<div class="form-error">题目不存在</div>';
        return null;
      }
      if (!r.ok) throw new Error("请求失败 " + r.status);
      return r.json();
    })
    .then(function (p) {
      if (!p) return;
      renderForm(p);
    })
    .catch(function (e) {
      root.innerHTML =
        '<div class="form-error">加载失败：' + escapeHtml(e.message) + "</div>";
    });
})();
