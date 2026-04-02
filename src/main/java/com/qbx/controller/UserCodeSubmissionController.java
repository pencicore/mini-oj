package com.qbx.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.qbx.auth.UserContext;
import com.qbx.entity.UserCodeSubmissionEntity;
import com.qbx.service.UserCodeSubmissionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/userCodeSubmissions")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserCodeSubmissionController {

    @Inject
    UserCodeSubmissionService userCodeSubmissionService;

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(UserCodeSubmissionEntity submission) throws JsonProcessingException {
        if (submission == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }
        UserCodeSubmissionEntity created = userCodeSubmissionService.create(submission);
        return Response.status(Response.Status.CREATED)
                .entity(created)
                .build();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        UserCodeSubmissionEntity entity = userCodeSubmissionService.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("代码提交记录不存在，id=" + id)
                    .build();
        }
        return Response.ok(entity).build();
    }

    @GET
    @Path("/page")
    public List<UserCodeSubmissionEntity> page(@QueryParam("page") @DefaultValue("1") int page,
                                               @QueryParam("size") @DefaultValue("10") int size) {
        return userCodeSubmissionService.findPage(page, size);
    }
}
