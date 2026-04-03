package com.qbx.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "contest_action")
public class ContestActionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "contest_id")
    private Long contestId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "judge_status", nullable = false, length = 50)
    private String judgeStatus;

    @Column(name = "status", nullable = false, length = 50)
    private String status;

    public ContestActionEntity() {
    }

    @PrePersist
    @PreUpdate
    void syncStatusWithJudgeStatus() {
        if (judgeStatus != null) {
            status = judgeStatus;
        } else if (status != null) {
            judgeStatus = status;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getContestId() {
        return contestId;
    }

    public void setContestId(Long contestId) {
        this.contestId = contestId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getProblemId() {
        return problemId;
    }

    public void setProblemId(Long problemId) {
        this.problemId = problemId;
    }

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
    }

    public String getJudgeStatus() {
        return judgeStatus;
    }

    public void setJudgeStatus(String judgeStatus) {
        this.judgeStatus = judgeStatus;
        if (judgeStatus != null) {
            this.status = judgeStatus;
        }
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
        if (status != null) {
            this.judgeStatus = status;
        }
    }

    @Override
    public String toString() {
        return "ContestActionEntity{id=" + id + ", contestId=" + contestId + ", userId=" + userId + ", problemId=" + problemId
                + ", submissionId=" + submissionId + ", judgeStatus=" + judgeStatus + ", status=" + status + "}";
    }
}
