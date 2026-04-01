package com.qbx.controller;

import com.qbx.entity.ProblemDetailEntity;
import com.qbx.service.ProblemDetailService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/problemDetails")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ProblemDetailController {

    @Inject
    ProblemDetailService problemDetailService;

    /**
     * 分页查询题目
     */
    @GET
    @Path("/page")
    public List<ProblemDetailEntity> page(@QueryParam("page") @DefaultValue("1") int page,
                                          @QueryParam("size") @DefaultValue("10") int size) {
        return problemDetailService.findPage(page, size);
    }

    /**
     * 根据 id 查询题目详情
     */
    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        ProblemDetailEntity entity = problemDetailService.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("题目不存在，id=" + id)
                    .build();
        }
        return Response.ok(entity).build();
    }

    /**
     * 新增题目
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(ProblemDetailEntity problem) {
        System.out.println("新增");
        System.out.println(problem);
        if (problem == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }

        ProblemDetailEntity created = problemDetailService.create(problem);
        return Response.status(Response.Status.CREATED)
                .entity(created)
                .build();
    }

    /**
     * 修改题目
     */
    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response update(@PathParam("id") Long id, ProblemDetailEntity updatedProblem) {
        if (updatedProblem == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }

        updatedProblem.setId(id);
        ProblemDetailEntity updated = problemDetailService.update(updatedProblem);

        if (updated == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("要更新的题目不存在，id=" + id)
                    .build();
        }

        return Response.ok(updated).build();
    }

    /**
     * 删除题目
     */
    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        ProblemDetailEntity entity = problemDetailService.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("要删除的题目不存在，id=" + id)
                    .build();
        }

        ProblemDetailEntity deleted = problemDetailService.delete(entity);
        return Response.ok(deleted).build();
    }
}