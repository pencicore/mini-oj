package com.qbx.service;

import com.qbx.entity.ContestEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class ContestService {

    @PersistenceContext
    EntityManager entityManager;

    @Transactional
    public ContestEntity create(ContestEntity contest) {
        if (contest.getProblemIds() == null) {
            contest.setProblemIds(List.of());
        }
        entityManager.persist(contest);
        return contest;
    }

    @Transactional
    public ContestEntity update(ContestEntity contest) {
        if (contest == null || contest.getId() == null) {
            return null;
        }
        ContestEntity managed = entityManager.find(ContestEntity.class, contest.getId());
        if (managed == null) {
            return null;
        }
        managed.setTitle(contest.getTitle());
        managed.setStartTime(contest.getStartTime());
        managed.setEndTime(contest.getEndTime());
        managed.setFreezeTime(contest.getFreezeTime());
        managed.getProblemIds().clear();
        if (contest.getProblemIds() != null) {
            managed.getProblemIds().addAll(contest.getProblemIds());
        }
        return managed;
    }

    @Transactional
    public ContestEntity delete(ContestEntity contest) {
        if (contest == null || contest.getId() == null) {
            return null;
        }
        ContestEntity managed = entityManager.find(ContestEntity.class, contest.getId());
        if (managed == null) {
            return null;
        }
        entityManager.remove(managed);
        return managed;
    }

    public List<ContestEntity> findPage(int page, int size) {
        if (page < 1) {
            page = 1;
        }
        if (size < 1) {
            size = 10;
        }
        return entityManager
                .createQuery("from ContestEntity order by id desc", ContestEntity.class)
                .setFirstResult((page - 1) * size)
                .setMaxResults(size)
                .getResultList();
    }

    public ContestEntity findById(Long id) {
        if (id == null) {
            return null;
        }
        return entityManager.find(ContestEntity.class, id);
    }
}
