package com.qbx.dto;

public class UserRegisterResponse {

    private Long id;
    private String username;
    private String userTpye;

    public UserRegisterResponse() {
    }

    public UserRegisterResponse(Long id, String username, String userTpye) {
        this.id = id;
        this.username = username;
        this.userTpye = userTpye;
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
}
