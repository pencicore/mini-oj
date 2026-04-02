package com.qbx.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "test_result")
public class TestResultEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "submission_id", nullable = false)
    private Long submissionId;

    @Column(name = "test_sample_id", nullable = false)
    private Long testSampleId;

    @Column(name = "actual_output", columnDefinition = "TEXT")
    private String actualOutput;

    /**
     * 判题结果：AC / WA / TLE / RE / CE
     */
    @Column(nullable = false)
    private String status;

    @Column(name = "time_used")
    private Integer timeUsed;

    @Column(name = "memory_used")
    private Integer memoryUsed;

    public TestResultEntity() {
    }

    public TestResultEntity(Long id, Long submissionId, Long testSampleId, String actualOutput, String status, Integer timeUsed, Integer memoryUsed) {
        this.id = id;
        this.submissionId = submissionId;
        this.testSampleId = testSampleId;
        this.actualOutput = actualOutput;
        this.status = status;
        this.timeUsed = timeUsed;
        this.memoryUsed = memoryUsed;
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
     * @return submissionId
     */
    public Long getSubmissionId() {
        return submissionId;
    }

    /**
     * 设置
     * @param submissionId
     */
    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
    }

    /**
     * 获取
     * @return testSampleId
     */
    public Long getTestSampleId() {
        return testSampleId;
    }

    /**
     * 设置
     * @param testSampleId
     */
    public void setTestSampleId(Long testSampleId) {
        this.testSampleId = testSampleId;
    }

    /**
     * 获取
     * @return actualOutput
     */
    public String getActualOutput() {
        return actualOutput;
    }

    /**
     * 设置
     * @param actualOutput
     */
    public void setActualOutput(String actualOutput) {
        this.actualOutput = actualOutput;
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
     * @return timeUsed
     */
    public Integer getTimeUsed() {
        return timeUsed;
    }

    /**
     * 设置
     * @param timeUsed
     */
    public void setTimeUsed(Integer timeUsed) {
        this.timeUsed = timeUsed;
    }

    /**
     * 获取
     * @return memoryUsed
     */
    public Integer getMemoryUsed() {
        return memoryUsed;
    }

    /**
     * 设置
     * @param memoryUsed
     */
    public void setMemoryUsed(Integer memoryUsed) {
        this.memoryUsed = memoryUsed;
    }

    public String toString() {
        return "TestResultEntity{id = " + id + ", submissionId = " + submissionId + ", testSampleId = " + testSampleId + ", actualOutput = " + actualOutput + ", status = " + status + ", timeUsed = " + timeUsed + ", memoryUsed = " + memoryUsed + "}";
    }
}