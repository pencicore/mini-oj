package com.qbx.service;

import com.qbx.entity.ProblemTestSampleEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class ProblemTestSampleService {

    @PersistenceContext
    EntityManager entityManager;

    @Transactional
    public ProblemTestSampleEntity create(ProblemTestSampleEntity problemTestSampleEntity) {
        entityManager.persist(problemTestSampleEntity);
        return problemTestSampleEntity;
    }

    @Transactional
    public ProblemTestSampleEntity delete(ProblemTestSampleEntity problemTestSampleEntity) {
        if (problemTestSampleEntity == null || problemTestSampleEntity.getId() == null) {
            return null;
        }
        ProblemTestSampleEntity managedEntity = entityManager.find(ProblemTestSampleEntity.class, problemTestSampleEntity.getId());
        if (managedEntity == null) {
            return null;
        }
        entityManager.remove(managedEntity);
        return managedEntity;
    }

    @Transactional
    public ProblemTestSampleEntity update(ProblemTestSampleEntity problemTestSampleEntity) {
        if (problemTestSampleEntity == null || problemTestSampleEntity.getId() == null) {
            return null;
        }
        ProblemTestSampleEntity managedEntity = entityManager.find(ProblemTestSampleEntity.class, problemTestSampleEntity.getId());
        if (managedEntity == null) {
            return null;
        }
        managedEntity.setProblemId(problemTestSampleEntity.getProblemId());
        managedEntity.setInput(problemTestSampleEntity.getInput());
        managedEntity.setExpectedOutput(problemTestSampleEntity.getExpectedOutput());
        managedEntity.setIsExample(problemTestSampleEntity.getIsExample());
        return managedEntity;
    }

    public List<ProblemTestSampleEntity> findPage(int page, int size) {
        if (page < 1) {
            page = 1;
        }
        if (size < 1) {
            size = 10;
        }
        return entityManager
                .createQuery("from ProblemTestSampleEntity order by id desc", ProblemTestSampleEntity.class)
                .setFirstResult((page - 1) * size)
                .setMaxResults(size)
                .getResultList();
    }

    public ProblemTestSampleEntity findById(Long id) {
        if (id == null) {
            return null;
        }
        return entityManager.find(ProblemTestSampleEntity.class, id);
    }

    public List<ProblemTestSampleEntity> findByProblemId(Long problemId) {
        if (problemId == null) {
            return List.of();
        }
        return entityManager
                .createQuery("from ProblemTestSampleEntity where problemId = :problemId order by id asc",
                        ProblemTestSampleEntity.class)
                .setParameter("problemId", problemId)
                .getResultList();
    }
}
