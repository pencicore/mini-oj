package com.qbx.service;

import com.qbx.entity.ProblemDetailEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class ProblemDetailService {

    @PersistenceContext
    EntityManager entityManager;

    @Transactional
    public ProblemDetailEntity create(ProblemDetailEntity problemDetailEntity) {
        entityManager.persist(problemDetailEntity);
        return problemDetailEntity;
    }

    @Transactional
    public ProblemDetailEntity delete(ProblemDetailEntity problemDetailEntity) {
        if (problemDetailEntity == null || problemDetailEntity.getId() == null) {
            return null;
        }
        ProblemDetailEntity managedEntity = entityManager.find(ProblemDetailEntity.class, problemDetailEntity.getId());
        if (managedEntity == null) {
            return null;
        }
        entityManager.remove(managedEntity);
        return managedEntity;
    }

    @Transactional
    public ProblemDetailEntity update(ProblemDetailEntity problemDetailEntity) {
        if (problemDetailEntity == null || problemDetailEntity.getId() == null) {
            return null;
        }
        ProblemDetailEntity managedEntity = entityManager.find(ProblemDetailEntity.class, problemDetailEntity.getId());
        if (managedEntity == null) {
            return null;
        }
        managedEntity.setTitle(problemDetailEntity.getTitle());
        managedEntity.setContent(problemDetailEntity.getContent());
        managedEntity.setTimeLimit(problemDetailEntity.getTimeLimit());
        managedEntity.setMemoryLimit(problemDetailEntity.getMemoryLimit());
        return managedEntity;
    }

    /**
     * 分页查询
     */
    public List<ProblemDetailEntity> findPage(int page, int size) {
        if (page < 1) {
            page = 1;
        }
        if (size < 1) {
            size = 10;
        }
        return entityManager
                .createQuery("from ProblemDetailEntity order by id desc", ProblemDetailEntity.class)
                .setFirstResult((page - 1) * size)
                .setMaxResults(size)
                .getResultList();
    }

    /**
     * 根据id查询
     */
    public ProblemDetailEntity findById(Long id) {
        if (id == null) {
            return null;
        }
        return entityManager.find(ProblemDetailEntity.class, id);
    }


}