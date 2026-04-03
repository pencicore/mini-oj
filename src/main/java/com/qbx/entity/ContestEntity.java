package com.qbx.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "contest")
public class ContestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    /**
     * 封榜时间：在此时间之后提交的得分在榜单上隐藏，直至比赛结束再揭晓。
     */
    @Column(name = "freeze_time")
    private LocalDateTime freezeTime;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "contest_problem", joinColumns = @JoinColumn(name = "contest_id"))
    @Column(name = "problem_id", nullable = false)
    @OrderColumn(name = "sort_order")
    private List<Long> problemIds = new ArrayList<>();

    public ContestEntity() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public LocalDateTime getFreezeTime() {
        return freezeTime;
    }

    public void setFreezeTime(LocalDateTime freezeTime) {
        this.freezeTime = freezeTime;
    }

    public List<Long> getProblemIds() {
        return problemIds;
    }

    public void setProblemIds(List<Long> problemIds) {
        this.problemIds = problemIds != null ? problemIds : new ArrayList<>();
    }

    @Override
    public String toString() {
        return "ContestEntity{id=" + id + ", title=" + title + ", startTime=" + startTime
                + ", endTime=" + endTime + ", freezeTime=" + freezeTime + ", problemIds=" + problemIds + "}";
    }
}
