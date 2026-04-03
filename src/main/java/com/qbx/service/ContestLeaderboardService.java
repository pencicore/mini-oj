package com.qbx.service;

import com.qbx.dto.ContestStandingsBundle;
import com.qbx.entity.ContestActionEntity;
import com.qbx.entity.ContestEntity;
import com.qbx.entity.UserCodeSubmissionEntity;
import com.qbx.entity.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class ContestLeaderboardService {

    public static final int PENALTY_MINUTES_PER_WRONG = 20;

    @PersistenceContext
    EntityManager entityManager;

    @Inject
    ContestService contestService;

    public ContestStandingsBundle build(Long contestId, boolean revealAll) {
        ContestStandingsBundle out = new ContestStandingsBundle();
        ContestEntity contest = contestService.findById(contestId);
        if (contest == null) {
            return out;
        }
        out.setContest(contest);

        List<ContestActionEntity> allForContest = entityManager
                .createQuery(
                        "from ContestActionEntity where contestId = :cid order by id desc",
                        ContestActionEntity.class
                )
                .setParameter("cid", contestId)
                .getResultList();
        out.setActions(new ArrayList<>(allForContest));

        LocalDateTime now = LocalDateTime.now();
        boolean fullReveal = revealAll || !now.isBefore(contest.getEndTime());
        LocalDateTime freeze = contest.getFreezeTime();
        boolean frozenStandings = !fullReveal && freeze != null && !now.isBefore(freeze);
        out.setFrozenStandings(frozenStandings);

        final LocalDateTime eventCutoff = frozenStandings ? freeze : null;

        Set<Long> allowedProblems = new HashSet<>(contest.getProblemIds());
        List<ContestActionEntity> actions = allForContest.stream()
                .filter(a -> contestId.equals(a.getContestId()))
                .filter(a -> allowedProblems.contains(a.getProblemId()))
                .collect(Collectors.toList());

        if (actions.isEmpty()) {
            out.setLeaderboard(List.of());
            return out;
        }

        Set<Long> submissionIds = actions.stream()
                .map(ContestActionEntity::getSubmissionId)
                .collect(Collectors.toSet());
        Map<Long, UserCodeSubmissionEntity> submissionMap = loadSubmissions(submissionIds);

        if (eventCutoff != null) {
            actions = actions.stream()
                    .filter(a -> {
                        UserCodeSubmissionEntity s = submissionMap.get(a.getSubmissionId());
                        return s != null && !s.getSubmitTime().isAfter(eventCutoff);
                    })
                    .collect(Collectors.toList());
        }

        if (actions.isEmpty()) {
            out.setLeaderboard(List.of());
            return out;
        }

        Map<Long, Map<Long, List<ContestActionEntity>>> byUserProblem = new HashMap<>();
        for (ContestActionEntity a : actions) {
            byUserProblem
                    .computeIfAbsent(a.getUserId(), k -> new HashMap<>())
                    .computeIfAbsent(a.getProblemId(), k -> new ArrayList<>())
                    .add(a);
        }

        for (Map<Long, List<ContestActionEntity>> m : byUserProblem.values()) {
            for (List<ContestActionEntity> list : m.values()) {
                list.sort(Comparator.comparing(a -> {
                    UserCodeSubmissionEntity s = submissionMap.get(a.getSubmissionId());
                    return s != null ? s.getSubmitTime() : LocalDateTime.MIN;
                }));
            }
        }

        Set<Long> userIds = byUserProblem.keySet();
        Map<Long, String> usernameById = loadUsernames(userIds);
        LocalDateTime start = contest.getStartTime();

        List<ContestStandingsBundle.Row> rows = new ArrayList<>();
        for (Long userId : userIds) {
            ContestStandingsBundle.Row row = new ContestStandingsBundle.Row();
            row.userId = userId;
            row.username = usernameById.getOrDefault(userId, "");
            int totalSolved = 0;
            int totalPenalty = 0;
            Map<Long, List<ContestActionEntity>> problemMap = byUserProblem.get(userId);

            for (Long problemId : contest.getProblemIds()) {
                List<ContestActionEntity> events = problemMap != null ? problemMap.getOrDefault(problemId, List.of()) : List.of();
                int[] sp = problemSolvedAndPenalty(events, submissionMap, start);
                totalSolved += sp[0];
                totalPenalty += sp[1];
            }
            row.solved = totalSolved;
            row.penalty = totalPenalty;
            rows.add(row);
        }

        rows.sort((a, b) -> {
            int c = Integer.compare(b.solved, a.solved);
            if (c != 0) {
                return c;
            }
            c = Integer.compare(a.penalty, b.penalty);
            if (c != 0) {
                return c;
            }
            return Long.compare(a.userId, b.userId);
        });

        int rank = 1;
        for (int i = 0; i < rows.size(); i++) {
            if (i > 0) {
                ContestStandingsBundle.Row prev = rows.get(i - 1);
                ContestStandingsBundle.Row cur = rows.get(i);
                if (cur.solved != prev.solved || cur.penalty != prev.penalty) {
                    rank = i + 1;
                }
            }
            rows.get(i).rank = rank;
        }

        out.setLeaderboard(rows);
        return out;
    }

    /**
     * @return [solved 0/1, penalty minutes for this problem]
     */
    private static int[] problemSolvedAndPenalty(
            List<ContestActionEntity> eventsChronological,
            Map<Long, UserCodeSubmissionEntity> submissionMap,
            LocalDateTime contestStart
    ) {
        int wrong = 0;
        for (ContestActionEntity e : eventsChronological) {
            String st = e.getJudgeStatus();
            if (isNonTerminal(st)) {
                continue;
            }
            if (isCompileError(st)) {
                continue;
            }
            UserCodeSubmissionEntity sub = submissionMap.get(e.getSubmissionId());
            if (sub == null) {
                continue;
            }
            int minutes = minutesFromStart(contestStart, sub.getSubmitTime());
            if (isSolved(st)) {
                int problemPenalty = minutes + wrong * PENALTY_MINUTES_PER_WRONG;
                return new int[]{1, problemPenalty};
            }
            if (countsAsPenaltyAttempt(st)) {
                wrong++;
            }
        }
        return new int[]{0, 0};
    }

    private static boolean isNonTerminal(String status) {
        return status == null
                || "PENDING".equals(status)
                || "JUDGING".equals(status)
                || "RUNNING".equals(status);
    }

    private static boolean isCompileError(String status) {
        return "CE".equals(status);
    }

    private static boolean isSolved(String status) {
        return "AC".equals(status);
    }

    private static boolean countsAsPenaltyAttempt(String status) {
        return "WA".equals(status) || "TLE".equals(status) || "RE".equals(status);
    }

    private static int minutesFromStart(LocalDateTime start, LocalDateTime event) {
        if (event == null || start == null) {
            return 0;
        }
        long m = Duration.between(start, event).toMinutes();
        return (int) Math.max(0, m);
    }

    private Map<Long, UserCodeSubmissionEntity> loadSubmissions(Set<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        List<UserCodeSubmissionEntity> list = entityManager
                .createQuery("from UserCodeSubmissionEntity where id in :ids", UserCodeSubmissionEntity.class)
                .setParameter("ids", ids)
                .getResultList();
        Map<Long, UserCodeSubmissionEntity> map = new HashMap<>();
        for (UserCodeSubmissionEntity s : list) {
            map.put(s.getId(), s);
        }
        return map;
    }

    private Map<Long, String> loadUsernames(Set<Long> userIds) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        List<UserEntity> users = entityManager
                .createQuery("from UserEntity where id in :ids", UserEntity.class)
                .setParameter("ids", userIds)
                .getResultList();
        Map<Long, String> map = new HashMap<>();
        for (UserEntity u : users) {
            map.put(u.getId(), u.getUsername());
        }
        return map;
    }
}
