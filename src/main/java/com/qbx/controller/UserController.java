package com.qbx.controller;

import com.qbx.dto.UserLoginRequest;
import com.qbx.dto.UserLoginResponse;
import com.qbx.dto.UserRegisterRequest;
import com.qbx.dto.UserRegisterResponse;
import com.qbx.entity.UserEntity;
import com.qbx.service.UserService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
public class UserController {

    @Inject
    UserService userService;

    @POST
    @Path("/register")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response register(UserRegisterRequest request) {
        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }

        UserEntity user = new UserEntity();
        user.setUsername(request.getUsername());
        user.setPassword(request.getPassword());
        UserEntity created = userService.register(user);
        if (created == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("注册失败，用户名已存在或参数不合法")
                    .build();
        }

        UserRegisterResponse response = new UserRegisterResponse(created.getId(), created.getUsername(), created.getUserTpye());
        return Response.status(Response.Status.CREATED)
                .entity(response)
                .build();
    }

    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response login(UserLoginRequest request) {
        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }

        UserLoginResponse response = userService.login(request.getUsername(), request.getPassword());
        if (response == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity("用户名或密码错误")
                    .build();
        }
        return Response.ok(response).build();
    }
}
