package com.qbx.service;

import com.qbx.entity.TestResultEntity;
import com.qbx.entity.UserCodeSubmissionEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class TestResultService {

    @PersistenceContext
    EntityManager entityManager;


    @Transactional
    public TestResultEntity create(TestResultEntity testResultEntity) {
        entityManager.persist(testResultEntity);
        return testResultEntity;
    }

    public List<TestResultEntity> findBySubmissionId(Long submissionId) {
        return entityManager
                .createQuery(
                        "from TestResultEntity where submissionId = :submissionId",
                        TestResultEntity.class
                )
                .setParameter("submissionId", submissionId)
                .getResultList();
    }
}
