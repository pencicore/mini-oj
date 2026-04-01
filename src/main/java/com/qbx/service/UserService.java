package com.qbx.service;

import com.qbx.dto.UserLoginResponse;
import com.qbx.entity.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
public class UserService {

    @PersistenceContext
    EntityManager entityManager;

    @Inject
    JwtTokenService jwtTokenService;

    @Transactional
    public UserEntity register(UserEntity user) {
        if (user == null || isBlank(user.getUsername()) || isBlank(user.getPassword())) {
            return null;
        }
        if (findByUsername(user.getUsername()) != null) {
            return null;
        }
        user.setId(null);
        user.setUserTpye("user");
        entityManager.persist(user);
        return user;
    }

    public UserLoginResponse login(String username, String password) {
        if (isBlank(username) || isBlank(password)) {
            return null;
        }

        UserEntity user = findByUsername(username);
        if (user == null || !password.equals(user.getPassword())) {
            return null;
        }

        String token = jwtTokenService.generateToken(user);
        return new UserLoginResponse(user.getId(), user.getUsername(), user.getUserTpye(), token);
    }

    public UserEntity findByUsername(String username) {
        if (isBlank(username)) {
            return null;
        }
        List<UserEntity> users = entityManager
                .createQuery("from UserEntity where username = :username", UserEntity.class)
                .setParameter("username", username)
                .setMaxResults(1)
                .getResultList();
        if (users.isEmpty()) {
            return null;
        }
        return users.get(0);
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
