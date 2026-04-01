package com.qbx.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "problem_test_sample")
public class ProblemTestSampleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String input;

    @Column(name = "expected_output", nullable = false, columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(name = "is_example", nullable = false)
    private boolean isExample;

    public ProblemTestSampleEntity() {
    }

    public ProblemTestSampleEntity(Long id, Long problemId, String input, String expectedOutput, boolean isExample) {
        this.id = id;
        this.problemId = problemId;
        this.input = input;
        this.expectedOutput = expectedOutput;
        this.isExample = isExample;
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
     * @return input
     */
    public String getInput() {
        return input;
    }

    /**
     * 设置
     * @param input
     */
    public void setInput(String input) {
        this.input = input;
    }

    /**
     * 获取
     * @return expectedOutput
     */
    public String getExpectedOutput() {
        return expectedOutput;
    }

    /**
     * 设置
     * @param expectedOutput
     */
    public void setExpectedOutput(String expectedOutput) {
        this.expectedOutput = expectedOutput;
    }

    /**
     * 获取
     * @return isExample
     */
    public boolean getIsExample() {
        return isExample;
    }

    /**
     * 设置
     * @param isExample
     */
    public void setIsExample(boolean isExample) {
        this.isExample = isExample;
    }

    public String toString() {
        return "ProblemTestSampleEntity{id = " + id + ", problemId = " + problemId + ", input = " + input + ", expectedOutput = " + expectedOutput + ", isExample = " + isExample + "}";
    }
}
