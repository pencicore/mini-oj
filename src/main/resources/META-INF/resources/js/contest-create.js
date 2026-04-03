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

  var formMsg = document.getElementById("contest-form-msg");

  function showFormMsg(kind, text) {
    formMsg.style.display = "block";
    formMsg.className =
      kind === "error" ? "form-error" : kind === "ok" ? "form-success" : "form-msg";
    formMsg.textContent = text;
  }

  var allProblems = [];
  var selectedIds = [];
  var idToTitle = {};

  function problemLetter(i) {
    if (i < 26) {
      return String.fromCharCode(65 + i);
    }
    return "P" + (i + 1);
  }

  var dropdownEl = document.getElementById("contest-problem-dropdown");
  var triggerBtn = document.getElementById("contest-problem-dd-trigger");
  var triggerTextEl = document.getElementById("contest-problem-dd-trigger-text");
  var panelEl = document.getElementById("contest-problem-dd-panel");

  function setDropdownOpen(open) {
    if (!dropdownEl || !triggerBtn || !panelEl) return;
    if (open) {
      dropdownEl.classList.add("is-open");
      triggerBtn.setAttribute("aria-expanded", "true");
      panelEl.setAttribute("aria-hidden", "false");
      var filterInput = document.getElementById("contest-problem-filter");
      if (filterInput) {
        requestAnimationFrame(function () {
          filterInput.focus();
          filterInput.select();
        });
      }
    } else {
      dropdownEl.classList.remove("is-open");
      triggerBtn.setAttribute("aria-expanded", "false");
      panelEl.setAttribute("aria-hidden", "true");
    }
  }

  function updateTriggerText() {
    if (!triggerTextEl) return;
    var n = selectedIds.length;
    triggerTextEl.classList.remove("contest-problem-dd-placeholder");
    if (!allProblems.length && !n) {
      triggerTextEl.textContent = "题库暂无题目";
      triggerTextEl.classList.add("contest-problem-dd-placeholder");
      return;
    }
    if (!n) {
      triggerTextEl.textContent = "点击展开选择题库题目…";
      triggerTextEl.classList.add("contest-problem-dd-placeholder");
      return;
    }
    var parts = [];
    var maxShow = 2;
    for (var i = 0; i < n && i < maxShow; i++) {
      var t = idToTitle[String(selectedIds[i])] || "";
      if (t.length > 18) {
        t = t.slice(0, 18) + "…";
      }
      parts.push(problemLetter(i) + ". " + (t || "—"));
    }
    var more = n > maxShow ? " 等 " + n + " 题" : " 共 " + n + " 题";
    triggerTextEl.textContent = parts.join(" · ") + more;
  }

  function renderProblemList() {
    var listEl = document.getElementById("contest-problem-list");
    if (!listEl) return;
    var filterRaw = document.getElementById("contest-problem-filter");
    var filter = ((filterRaw && filterRaw.value) || "").trim().toLowerCase();
    var filtered = allProblems.filter(function (p) {
      if (!filter) return true;
      var t = (p.title || "").toLowerCase();
      return t.indexOf(filter) >= 0 || String(p.id).indexOf(filter) >= 0;
    });
    if (!allProblems.length) {
      return;
    }
    if (!filtered.length) {
      listEl.innerHTML = '<div class="contest-problem-empty">无匹配题目</div>';
      return;
    }
    var html = '<div class="contest-problem-list-inner">';
    filtered.forEach(function (p) {
      var id = p.id;
      var n = Number(id);
      var checked = selectedIds.indexOf(n) >= 0;
      html +=
        '<label class="contest-problem-row">' +
        '<input type="checkbox" data-problem-id="' +
        escapeHtml(String(id)) +
        '" ' +
        (checked ? "checked " : "") +
        "/>" +
        '<span class="contest-problem-row-title">' +
        escapeHtml(p.title || "（无标题）") +
        "</span></label>";
    });
    html += "</div>";
    listEl.innerHTML = html;
    listEl.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
      cb.addEventListener("change", onCheckboxChange);
    });
  }

  function onCheckboxChange(e) {
    var t = e.target;
    var id = Number(t.getAttribute("data-problem-id"));
    if (t.checked) {
      if (selectedIds.indexOf(id) < 0) {
        selectedIds.push(id);
      }
    } else {
      selectedIds = selectedIds.filter(function (x) {
        return x !== id;
      });
    }
    renderSelectedOnly();
  }

  function renderSelectedOnly() {
    var ol = document.getElementById("contest-problem-selected");
    if (!ol) return;
    if (!selectedIds.length) {
      ol.innerHTML =
        '<li class="contest-problem-selected-empty">暂无，请展开上方下拉框勾选题目</li>';
      updateTriggerText();
      return;
    }
    var html = "";
    selectedIds.forEach(function (pid, i) {
      var letter = problemLetter(i);
      var title = idToTitle[String(pid)] || "（无标题）";
      html +=
        '<li class="contest-problem-selected-item">' +
        '<span class="contest-problem-selected-letter">' +
        escapeHtml(letter) +
        "</span>" +
        '<span class="contest-problem-selected-title">' +
        escapeHtml(title) +
        '</span><span class="contest-problem-selected-actions">' +
        '<button type="button" class="btn-ghost-edit contest-problem-move" data-action="up" data-index="' +
        i +
        '">上移</button>' +
        '<button type="button" class="btn-ghost-edit contest-problem-move" data-action="down" data-index="' +
        i +
        '">下移</button>' +
        '<button type="button" class="btn-ghost-edit contest-problem-move" data-action="remove" data-index="' +
        i +
        '">移除</button>' +
        "</span></li>";
    });
    ol.innerHTML = html;
    ol.querySelectorAll(".contest-problem-move").forEach(function (btn) {
      btn.addEventListener("click", onSelectedAction);
    });
    updateTriggerText();
  }

  function onSelectedAction(e) {
    var btn = e.target.closest(".contest-problem-move");
    if (!btn) return;
    var action = btn.getAttribute("data-action");
    var i = Number(btn.getAttribute("data-index"));
    if (action === "remove") {
      selectedIds.splice(i, 1);
    } else if (action === "up" && i > 0) {
      var t = selectedIds[i - 1];
      selectedIds[i - 1] = selectedIds[i];
      selectedIds[i] = t;
    } else if (action === "down" && i < selectedIds.length - 1) {
      var u = selectedIds[i + 1];
      selectedIds[i + 1] = selectedIds[i];
      selectedIds[i] = u;
    }
    renderSelectedOnly();
    renderProblemList();
  }

  function loadProblems() {
    var listEl = document.getElementById("contest-problem-list");
    authFetch(API.problemDetailsPage(1, 500))
      .then(function (r) {
        if (!r.ok) throw new Error("加载题目失败 " + r.status);
        return r.json();
      })
      .then(function (rows) {
        allProblems = rows || [];
        idToTitle = {};
        allProblems.forEach(function (p) {
          if (p.id != null) {
            idToTitle[String(p.id)] = p.title || "";
          }
        });
        if (!allProblems.length) {
          listEl.innerHTML =
            '<div class="contest-problem-empty">题库中暂无题目，请先在题目管理中新建。</div>';
          updateTriggerText();
          return;
        }
        renderProblemList();
        renderSelectedOnly();
        updateTriggerText();
      })
      .catch(function (err) {
        listEl.innerHTML =
          '<div class="form-error">' +
          escapeHtml(err.message || String(err)) +
          "</div>";
        if (triggerTextEl) {
          triggerTextEl.textContent = "题目列表加载失败";
          triggerTextEl.classList.add("contest-problem-dd-placeholder");
        }
      });
  }

  var filterInput = document.getElementById("contest-problem-filter");
  if (filterInput) {
    filterInput.addEventListener("input", function () {
      renderProblemList();
    });
    filterInput.addEventListener("click", function (e) {
      e.stopPropagation();
    });
    filterInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
      }
    });
  }

  if (triggerBtn) {
    triggerBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (dropdownEl.classList.contains("is-open")) {
        setDropdownOpen(false);
      } else {
        setDropdownOpen(true);
      }
    });
  }

  var doneBtn = document.getElementById("contest-problem-dd-done");
  if (doneBtn) {
    doneBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setDropdownOpen(false);
    });
  }

  document.addEventListener("click", function (e) {
    if (!dropdownEl || !dropdownEl.classList.contains("is-open")) return;
    if (dropdownEl.contains(e.target)) return;
    setDropdownOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dropdownEl && dropdownEl.classList.contains("is-open")) {
      setDropdownOpen(false);
      if (triggerBtn) {
        triggerBtn.focus();
      }
    }
  });

  loadProblems();

  var form = document.getElementById("contest-create-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      formMsg.style.display = "none";
      var title = (document.getElementById("contest-title").value || "").trim();
      var startRaw = document.getElementById("contest-start").value;
      var endRaw = document.getElementById("contest-end").value;
      var freezeRaw = document.getElementById("contest-freeze").value;

      var body = {
        title: title,
        startTime: localDateTimeToIso(startRaw),
        endTime: localDateTimeToIso(endRaw),
        problemIds: selectedIds.slice(),
      };
      if (freezeRaw && String(freezeRaw).trim() !== "") {
        body.freezeTime = localDateTimeToIso(freezeRaw);
      } else {
        body.freezeTime = null;
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
          showFormMsg("ok", "创建成功，正在返回比赛管理…");
          setTimeout(function () {
            window.location.href = "contest-admin.html";
          }, 900);
        })
        .catch(function (err) {
          showFormMsg("error", err.message || String(err));
        });
    });
  }
})();
