package com.qbx.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_code_submission")
public class UserCodeSubmissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String code;

    @Column(nullable = false, length = 50)
    private String language;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "submit_time", nullable = false)
    private LocalDateTime submitTime;

    /**
     * 是否为比赛提交（普通练习题为 false）。
     */
    @Column(name = "contest_submission", nullable = false, columnDefinition = "boolean default false")
    private Boolean contestSubmission;

    @Column(name = "contest_id")
    private Long contestId;

    public UserCodeSubmissionEntity() {
    }

    public UserCodeSubmissionEntity(Long id, Long userId, Long problemId, String code, String language, String status, LocalDateTime submitTime, boolean contestSubmission, Long contestId) {
        this.id = id;
        this.userId = userId;
        this.problemId = problemId;
        this.code = code;
        this.language = language;
        this.status = status;
        this.submitTime = submitTime;
        this.contestSubmission = contestSubmission;
        this.contestId = contestId;
    }

    /**
     * 获取
     * @return id
     */
    public Long getId() {
        return id;
    }

    /**
     * 设置
     * @param id
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * 获取
     * @return userId
     */
    public Long getUserId() {
        return userId;
    }

    /**
     * 设置
     * @param userId
     */
    public void setUserId(Long userId) {
        this.userId = userId;
    }

    /**
     * 获取
     * @return problemId
     */
    public Long getProblemId() {
        return problemId;
    }

    /**
     * 设置
     * @param problemId
     */
    public void setProblemId(Long problemId) {
        this.problemId = problemId;
    }

    /**
     * 获取
     * @return code
     */
    public String getCode() {
        return code;
    }

    /**
     * 设置
     * @param code
     */
    public void setCode(String code) {
        this.code = code;
    }

    /**
     * 获取
     * @return language
     */
    public String getLanguage() {
        return language;
    }

    /**
     * 设置
     * @param language
     */
    public void setLanguage(String language) {
        this.language = language;
    }

    /**
     * 获取
     * @return status
     */
    public String getStatus() {
        return status;
    }

    /**
     * 设置
     * @param status
     */
    public void setStatus(String status) {
        this.status = status;
    }

    /**
     * 获取
     * @return submitTime
     */
    public LocalDateTime getSubmitTime() {
        return submitTime;
    }

    /**
     * 设置
     * @param submitTime
     */
    public void setSubmitTime(LocalDateTime submitTime) {
        this.submitTime = submitTime;
    }

    public boolean isContestSubmission() {
        return contestSubmission;
    }

    public void setContestSubmission(boolean contestSubmission) {
        this.contestSubmission = contestSubmission;
    }

    public Long getContestId() {
        return contestId;
    }

    public void setContestId(Long contestId) {
        this.contestId = contestId;
    }

    public String toString() {
        return "UserCodeSubmissionEntity{id = " + id + ", userId = " + userId + ", problemId = " + problemId + ", language = " + language + ", status = " + status + ", submitTime = " + submitTime + ", contestSubmission = " + contestSubmission + ", contestId = " + contestId + "}";
    }

    /**
     * 获取
     * @return contestSubmission
     */
    public Boolean getContestSubmission() {
        return contestSubmission;
    }
}
