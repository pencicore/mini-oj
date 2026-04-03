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

  function problemLabelForPid(contest, pid) {
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
      return "题目 #" + pid;
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
  };

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

    if (!mine.length) {
      modalBody.innerHTML =
        '<p class="problem-examples-hint" style="margin:0">暂无比赛提交记录。</p>';
    } else {
      var html =
        '<div class="table-wrap"><table class="data-table"><thead><tr>' +
        "<th>题目</th><th>结果</th><th>提交</th>" +
        "</tr></thead><tbody>";
      mine.forEach(function (a) {
        var pl = problemLabelForPid(contest, a.problemId);
        var st = a.judgeStatus != null ? String(a.judgeStatus) : "—";
        var sid = a.submissionId != null ? String(a.submissionId) : "";
        html +=
          "<tr><td>" +
          escapeHtml(pl) +
          "</td><td>" +
          escapeHtml(st) +
          '</td><td><a class="title-link" href="submission-detail.html?id=' +
          encodeURIComponent(sid) +
          '">#' +
          escapeHtml(sid) +
          "</a></td></tr>";
      });
      html += "</tbody></table></div>";
      modalBody.innerHTML = html;
    }

    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
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
        "</header>";

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
})();
