(function () {
  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function parseId() {
    var q = new URLSearchParams(window.location.search);
    var id = q.get("id");
    if (!id || !/^\d+$/.test(String(id).trim())) return null;
    return String(id).trim();
  }

  function getCurrentUserId() {
    try {
      var raw = localStorage.getItem("user");
      if (!raw) return null;
      var u = JSON.parse(raw);
      if (u.id == null) return null;
      return Number(u.id);
    } catch (e) {
      return null;
    }
  }

  function problemLabel(i) {
    if (i < 26) {
      return String.fromCharCode(65 + i);
    }
    return "P" + (i + 1);
  }

  function problemLetterForPid(contest, pid) {
    var ids = contest.problemIds != null ? contest.problemIds : [];
    var n = Number(pid);
    var idx = -1;
    for (var i = 0; i < ids.length; i++) {
      if (Number(ids[i]) === n) {
        idx = i;
        break;
      }
    }
    if (idx < 0) {
      return "—";
    }
    return problemLabel(idx);
  }

  function avatarInitial(username) {
    var s = username != null ? String(username).trim() : "";
    if (!s) return "?";
    return s.charAt(0);
  }

  var root = document.getElementById("contest-standings-root");
  var detailLink = document.getElementById("standings-link-detail");
  var modal = document.getElementById("standings-my-actions-modal");
  var modalBody = document.getElementById("standings-my-actions-body");
  var cid = parseId();

  var state = {
    contest: null,
    allActions: [],
    myUserId: null,
    timeBarTimerId: null,
  };

  function parseContestInstant(s) {
    if (s == null || s === "") return null;
    var str = String(s).trim();
    var m =
      /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?/.exec(
        str
      );
    if (!m) return null;
    return new Date(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      m[6] != null && m[6] !== "" ? Number(m[6]) : 0
    );
  }

  function formatRemainMs(ms) {
    if (ms <= 0) return "00:00:00";
    var sec = Math.floor(ms / 1000);
    var h = Math.floor(sec / 3600);
    var mi = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    function pad(n) {
      return n < 10 ? "0" + n : "" + n;
    }
    if (h >= 24) {
      var d = Math.floor(h / 24);
      h = h % 24;
      return d + " 天 " + pad(h) + ":" + pad(mi) + ":" + pad(s);
    }
    return pad(h) + ":" + pad(mi) + ":" + pad(s);
  }

  function updateContestTimeBarUI() {
    var contest = state.contest;
    var fillEl = document.getElementById("contest-time-bar-fill");
    var phaseEl = document.getElementById("contest-time-bar-phase");
    var countEl = document.getElementById("contest-time-bar-countdown");
    var whenEl = document.getElementById("contest-time-bar-when");
    if (!contest || !fillEl || !phaseEl || !countEl) return;
    var start = parseContestInstant(contest.startTime);
    var end = parseContestInstant(contest.endTime);
    if (!start || !end) return;
    var now = Date.now();
    var total = end.getTime() - start.getTime();
    if (total <= 0) {
      total = 1;
    }

    if (whenEl) {
      whenEl.textContent =
        "开始 " +
        (typeof formatSubmitTime === "function"
          ? formatSubmitTime(contest.startTime)
          : String(contest.startTime)) +
        " · 结束 " +
        (typeof formatSubmitTime === "function"
          ? formatSubmitTime(contest.endTime)
          : String(contest.endTime));
    }

    if (now < start.getTime()) {
      fillEl.style.width = "0%";
      phaseEl.textContent = "未开始";
      countEl.textContent = "距开始 " + formatRemainMs(start.getTime() - now);
    } else if (now >= end.getTime()) {
      fillEl.style.width = "100%";
      phaseEl.textContent = "已结束";
      countEl.textContent = "比赛已结束";
    } else {
      var elapsed = now - start.getTime();
      var pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
      fillEl.style.width = pct.toFixed(2) + "%";
      phaseEl.textContent = "进行中";
      countEl.textContent = "剩余 " + formatRemainMs(end.getTime() - now);
    }
  }

  function startContestTimeBarTimer() {
    if (state.timeBarTimerId) {
      clearInterval(state.timeBarTimerId);
    }
    updateContestTimeBarUI();
    state.timeBarTimerId = setInterval(updateContestTimeBarUI, 1000);
  }

  function closeModal() {
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function openMyActionsModal() {
    if (!modal || !modalBody) return;
    var contest = state.contest;
    var uid = state.myUserId;
    if (!contest || uid == null) return;

    var mine = state.allActions.filter(function (a) {
      return Number(a.userId) === Number(uid);
    });
    mine.sort(function (a, b) {
      return Number(b.id) - Number(a.id);
    });

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (!mine.length) {
      modalBody.innerHTML =
        '<p class="problem-examples-hint" style="margin:0">暂无比赛提交记录。</p>';
      return;
    }

    var seen = {};
    var pids = [];
    mine.forEach(function (a) {
      var pid = a.problemId;
      if (pid != null && !seen[pid]) {
        seen[pid] = true;
        pids.push(pid);
      }
    });

    modalBody.innerHTML =
      '<div class="loading" style="padding:1rem"><span class="loading-spinner" aria-hidden="true"></span>加载中…</div>';

    Promise.all(
      pids.map(function (pid) {
        return authFetch(API.problemDetail(pid)).then(function (r) {
          if (!r.ok) {
            return { pid: pid, title: null };
          }
          return r.json().then(function (p) {
            return { pid: pid, title: p.title };
          });
        });
      })
    ).then(function (pairs) {
      var titles = {};
      pairs.forEach(function (x) {
        titles[String(x.pid)] = x.title;
      });
      var html =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>题目</th><th>结果</th><th>提交</th>" +
        "</tr></thead><tbody>";
      mine.forEach(function (a) {
        var letter = problemLetterForPid(contest, a.problemId);
        var pt = titles[String(a.problemId)];
        var ptStr =
          pt != null && String(pt).trim() !== ""
            ? String(pt).trim()
            : "（无标题）";
        var cell = letter + ". " + ptStr;
        var st = a.judgeStatus != null ? String(a.judgeStatus) : "—";
        var sid = a.submissionId != null ? String(a.submissionId) : "";
        html +=
          "<tr><td>" +
          escapeHtml(cell) +
          "</td><td>" +
          escapeHtml(st) +
          '</td><td><a class="title-link" href="submission-detail.html?id=' +
          encodeURIComponent(sid) +
          '">查看</a></td></tr>';
      });
      html += "</tbody></table></div>";
      modalBody.innerHTML = html;
    });
  }

  function bindModalEvents() {
    if (!modal) return;
    var backdrop = modal.querySelector(".standings-modal-backdrop");
    var closeBtn = modal.querySelector(".standings-modal-close");
    if (backdrop) {
      backdrop.addEventListener("click", closeModal);
    }
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && !modal.hidden) {
        closeModal();
      }
    });
  }

  if (!cid) {
    root.innerHTML =
      '<div class="form-error">缺少比赛 id，请从 <a href="contests.html">比赛列表</a> 进入。</div>';
    if (detailLink) {
      detailLink.style.display = "none";
    }
    return;
  }

  if (detailLink) {
    detailLink.href = "contest-detail.html?id=" + encodeURIComponent(cid);
  }

  bindModalEvents();

  authFetch(API.contestLeaderboard(cid))
    .then(function (r) {
      if (r.status === 404) throw new Error("比赛不存在。");
      if (!r.ok) throw new Error("加载榜单失败 " + r.status);
      return r.json();
    })
    .then(function (bundle) {
      var contest = bundle.contest;
      if (!contest) {
        throw new Error("比赛不存在。");
      }
      state.contest = contest;
      state.allActions = bundle.actions != null ? bundle.actions : [];
      state.myUserId = getCurrentUserId();

      var frozen = !!bundle.frozenStandings;
      var rows = bundle.leaderboard != null ? bundle.leaderboard : [];
      var title = contest.title || "比赛";
      document.title = title + " — 排行榜 — Mini OJ";

      var myId = state.myUserId;

      var html = "";
      html +=
        '<header class="page-header">' +
        '<div class="page-header-text">' +
        '<h1 class="page-title">' +
        escapeHtml(title) +
        "</h1>" +
        '<p class="page-desc">实时排名 · 过题数相同时按总罚时（分钟）排序。登录后可在本人一行点击头像查看本场比赛提交记录。</p>' +
        "</div>" +
        "</header>" +
        '<div class="icpc-time-bar" id="contest-time-bar" aria-label="比赛时间">' +
        '<div class="icpc-time-bar-rail" role="presentation">' +
        '<div class="icpc-time-bar-fill" id="contest-time-bar-fill"></div>' +
        "</div>" +
        '<div class="icpc-time-bar-row">' +
        '<span class="icpc-time-bar-phase" id="contest-time-bar-phase">—</span>' +
        '<span class="icpc-time-bar-countdown" id="contest-time-bar-countdown" aria-live="polite">—</span>' +
        "</div>" +
        '<p class="icpc-time-bar-when" id="contest-time-bar-when"></p>' +
        "</div>";

      if (frozen) {
        html +=
          '<div class="detail-card" style="margin-bottom:1rem">' +
          '<p class="problem-examples-hint" style="margin:0">' +
          "当前为封榜展示，榜单仅统计封榜前提交；比赛结束后揭晓完整排名。" +
          "</p></div>";
      }

      if (!rows.length) {
        html +=
          '<div class="detail-card"><p class="problem-examples-hint" style="margin:0">暂无提交记录。</p></div>';
      } else {
        html +=
          '<div class="table-wrap"><table class="data-table standings-table"><thead><tr>' +
          "<th>名次</th><th>用户</th><th>过题</th><th>罚时（分钟）</th>" +
          "</tr></thead><tbody>";
        rows.forEach(function (row) {
          var nameRaw = row.username != null ? String(row.username) : "—";
          var nameHtml = escapeHtml(nameRaw);
          var rowUid = row.userId != null ? Number(row.userId) : NaN;
          var isSelf = myId != null && !isNaN(rowUid) && rowUid === myId;

          var userCell;
          if (isSelf) {
            userCell =
              '<button type="button" class="standings-self-trigger" data-standings-self="1" title="查看我的比赛提交">' +
              '<span class="standings-avatar" aria-hidden="true">' +
              escapeHtml(avatarInitial(nameRaw)) +
              "</span>" +
              '<span class="standings-name">' +
              nameHtml +
              "</span>" +
              "</button>";
          } else {
            userCell = nameHtml;
          }

          html +=
            "<tr" +
            (isSelf ? ' class="standings-row--self"' : "") +
            "><td class=\"cell-num\">" +
            escapeHtml(String(row.rank)) +
            "</td><td>" +
            userCell +
            "</td><td>" +
            escapeHtml(String(row.solved)) +
            "</td><td>" +
            escapeHtml(String(row.penalty)) +
            "</td></tr>";
        });
        html += "</tbody></table></div>";
      }

      root.innerHTML = html;

      startContestTimeBarTimer();

      root.addEventListener("click", function (e) {
        var btn = e.target.closest(".standings-self-trigger");
        if (!btn) return;
        e.preventDefault();
        openMyActionsModal();
      });
    })
    .catch(function (e) {
      root.innerHTML =
        '<div class="form-error">' + escapeHtml(e.message || String(e)) + "</div>";
    });

  window.addEventListener("beforeunload", function () {
    if (state.timeBarTimerId) {
      clearInterval(state.timeBarTimerId);
      state.timeBarTimerId = null;
    }
  });
})();
