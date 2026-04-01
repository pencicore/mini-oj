package com.qbx.controller;

import com.qbx.entity.ProblemTestSampleEntity;
import com.qbx.service.ProblemTestSampleService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/problemTestSamples")
@Produces(MediaType.APPLICATION_JSON)
public class ProblemTestSampleController {

    @Inject
    ProblemTestSampleService problemTestSampleService;

    @GET
    @Path("/page")
    public List<ProblemTestSampleEntity> page(@QueryParam("page") @DefaultValue("1") int page,
                                              @QueryParam("size") @DefaultValue("10") int size) {
        return problemTestSampleService.findPage(page, size);
    }

    @GET
    @Path("/problem/{problemId}")
    public List<ProblemTestSampleEntity> listByProblemId(@PathParam("problemId") Long problemId) {
        return problemTestSampleService.findByProblemId(problemId);
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        ProblemTestSampleEntity entity = problemTestSampleService.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("测试样例不存在，id=" + id)
                    .build();
        }
        return Response.ok(entity).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(ProblemTestSampleEntity sample) {
        if (sample == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }
        ProblemTestSampleEntity created = problemTestSampleService.create(sample);
        return Response.status(Response.Status.CREATED)
                .entity(created)
                .build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response update(@PathParam("id") Long id, ProblemTestSampleEntity updatedSample) {
        if (updatedSample == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }
        updatedSample.setId(id);
        ProblemTestSampleEntity updated = problemTestSampleService.update(updatedSample);
        if (updated == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("要更新的测试样例不存在，id=" + id)
                    .build();
        }
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        ProblemTestSampleEntity entity = problemTestSampleService.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("要删除的测试样例不存在，id=" + id)
                    .build();
        }
        ProblemTestSampleEntity deleted = problemTestSampleService.delete(entity);
        return Response.ok(deleted).build();
    }
}
