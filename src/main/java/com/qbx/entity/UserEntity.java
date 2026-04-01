package com.qbx.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_info")
public class UserEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100, unique = true)
    private String username;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "user_tpye", nullable = false, length = 50)
    private String userTpye;


    public UserEntity() {
    }

    public UserEntity(Long id, String username, String password, String userTpye) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.userTpye = userTpye;
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
     * @return username
     */
    public String getUsername() {
        return username;
    }

    /**
     * 设置
     * @param username
     */
    public void setUsername(String username) {
        this.username = username;
    }

    /**
     * 获取
     * @return password
     */
    public String getPassword() {
        return password;
    }

    /**
     * 设置
     * @param password
     */
    public void setPassword(String password) {
        this.password = password;
    }

    /**
     * 获取
     * @return userTpye
     */
    public String getUserTpye() {
        return userTpye;
    }

    /**
     * 设置
     * @param userTpye
     */
    public void setUserTpye(String userTpye) {
        this.userTpye = userTpye;
    }

    public String toString() {
        return "UserEntity{id = " + id + ", username = " + username + ", password = " + password + ", userTpye = " + userTpye + "}";
    }
}
