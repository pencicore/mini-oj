package com.qbx.controller;

import com.qbx.entity.ContestActionEntity;
import com.qbx.service.ContestActionService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/contestActions")
@Produces(MediaType.APPLICATION_JSON)
public class ContestActionController {

    @Inject
    ContestActionService contestActionService;

    @GET
    @Path("/page")
    public List<ContestActionEntity> page(@QueryParam("page") @DefaultValue("1") int page,
                                          @QueryParam("size") @DefaultValue("10") int size) {
        return contestActionService.findPage(page, size);
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        ContestActionEntity entity = contestActionService.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("比赛动作不存在或无权查看，id=" + id)
                    .build();
        }
        return Response.ok(entity).build();
    }
}
