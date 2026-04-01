package com.qbx.service;

import com.qbx.auth.UserContext;
import com.qbx.entity.UserCodeSubmissionEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@ApplicationScoped
public class UserCodeSubmissionService {

    @PersistenceContext
    EntityManager entityManager;

    @Transactional
    public UserCodeSubmissionEntity create(UserCodeSubmissionEntity submission) {
        submission.setStatus("PENDING");
        submission.setSubmitTime(LocalDateTime.now());
        submission.setUserId(UserContext.getCurrentUserId());
        entityManager.persist(submission);
        return submission;
    }

    public UserCodeSubmissionEntity findById(Long id) {
        if (id == null) return null;
        UserCodeSubmissionEntity codeSubmission = entityManager.find(UserCodeSubmissionEntity.class, id);
        System.out.println(codeSubmission);
        System.out.println(codeSubmission.getUserId().equals(UserContext.getCurrentUserId()));
        System.out.println(UserContext.getCurrentUserId());
        System.out.println(codeSubmission.getUserId());
        if (!codeSubmission.getUserId().equals(UserContext.getCurrentUserId())) return null;
        return codeSubmission;
    }

    public List<UserCodeSubmissionEntity> findPage(int page, int size) {
        if (page < 1) page = 1;
        if (size < 1) size = 10;
        Long userId = UserContext.getCurrentUserId();
        return entityManager
                .createQuery(
                        "from UserCodeSubmissionEntity where userId = :userId order by id desc",
                        UserCodeSubmissionEntity.class
                )
                .setParameter("userId", userId)  // 这里必须和上面 :userId 完全一样
                .setFirstResult((page - 1) * size)
                .setMaxResults(size)
                .getResultList();
    }
}
