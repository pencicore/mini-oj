package com.qbx.service;

import com.qbx.auth.UserContext;
import com.qbx.entity.ContestActionEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class ContestActionService {

    @PersistenceContext
    EntityManager entityManager;

    @Transactional
    public ContestActionEntity create(ContestActionEntity action) {
        Long ctx = UserContext.getCurrentUserId();
        if (ctx != null) {
            action.setUserId(ctx);
        }
        entityManager.persist(action);
        return action;
    }

    public ContestActionEntity findById(Long id) {
        if (id == null) {
            return null;
        }
        ContestActionEntity entity = entityManager.find(ContestActionEntity.class, id);
        if (entity == null || !entity.getUserId().equals(UserContext.getCurrentUserId())) {
            return null;
        }
        return entity;
    }

    public List<ContestActionEntity> findPage(int page, int size) {
        if (page < 1) {
            page = 1;
        }
        if (size < 1) {
            size = 10;
        }
        Long userId = UserContext.getCurrentUserId();
        return entityManager
                .createQuery(
                        "from ContestActionEntity where userId = :userId order by id desc",
                        ContestActionEntity.class
                )
                .setParameter("userId", userId)
                .setFirstResult((page - 1) * size)
                .setMaxResults(size)
                .getResultList();
    }
}
