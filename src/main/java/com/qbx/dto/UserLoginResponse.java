package com.qbx.dto;

public class UserLoginResponse {

    private Long id;
    private String username;
    private String userTpye;
    private String token;

    public UserLoginResponse() {
    }

    public UserLoginResponse(Long id, String username, String userTpye, String token) {
        this.id = id;
        this.username = username;
        this.userTpye = userTpye;
        this.token = token;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUserTpye() {
        return userTpye;
    }

    public void setUserTpye(String userTpye) {
        this.userTpye = userTpye;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
