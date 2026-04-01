package com.qbx.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "problem_detail")
public class ProblemDetailEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "time_limit")
    private Integer timeLimit;

    @Column(name = "memory_limit")
    private Integer memoryLimit;


    public ProblemDetailEntity() {
    }

    public ProblemDetailEntity(Long id, String title, String content, Integer timeLimit, Integer memoryLimit) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.timeLimit = timeLimit;
        this.memoryLimit = memoryLimit;
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Integer getTimeLimit() {
        return timeLimit;
    }

    public void setTimeLimit(Integer timeLimit) {
        this.timeLimit = timeLimit;
    }

    public Integer getMemoryLimit() {
        return memoryLimit;
    }

    public void setMemoryLimit(Integer memoryLimit) {
        this.memoryLimit = memoryLimit;
    }

    public String toString() {
        return "ProblemDetailEntity{id = " + id + ", title = " + title + ", content = " + content + ", timeLimit = " + timeLimit + ", memoryLimit = " + memoryLimit + "}";
    }
}