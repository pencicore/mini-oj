package com.qbx.service;

import com.qbx.entity.TestResultEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class TestResultService {

    @PersistenceContext
    EntityManager entityManager;


    @Transactional
    public TestResultEntity create(TestResultEntity testResultEntity) {
        entityManager.persist(testResultEntity);
        return testResultEntity;
    }
}
