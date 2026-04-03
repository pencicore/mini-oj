package com.qbx.dto;

import com.qbx.entity.ContestActionEntity;
import com.qbx.entity.ContestEntity;

import java.util.ArrayList;
import java.util.List;

/**
 * 一场比赛：比赛实体 + 全部比赛动作 + XCPC 榜单（一次返回）。
 */
public class ContestStandingsBundle {

    private ContestEntity contest;
    /** 是否处于封榜展示（仅统计封榜前提交用于榜单） */
    private boolean frozenStandings;
    private List<ContestActionEntity> actions = new ArrayList<>();
    private List<Row> leaderboard = new ArrayList<>();

    public ContestEntity getContest() {
        return contest;
    }

    public void setContest(ContestEntity contest) {
        this.contest = contest;
    }

    public boolean isFrozenStandings() {
        return frozenStandings;
    }

    public void setFrozenStandings(boolean frozenStandings) {
        this.frozenStandings = frozenStandings;
    }

    public List<ContestActionEntity> getActions() {
        return actions;
    }

    public void setActions(List<ContestActionEntity> actions) {
        this.actions = actions;
    }

    public List<Row> getLeaderboard() {
        return leaderboard;
    }

    public void setLeaderboard(List<Row> leaderboard) {
        this.leaderboard = leaderboard;
    }

    /** 榜单一行：名次、用户、过题数、总罚时（分钟） */
    public static class Row {
        public int rank;
        public long userId;
        public String username;
        public int solved;
        public int penalty;
    }
}
