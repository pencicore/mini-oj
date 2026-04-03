package com.qbx.controller;

import com.qbx.entity.ContestEntity;
import com.qbx.service.ContestLeaderboardService;
import com.qbx.service.ContestService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/contests")
@Produces(MediaType.APPLICATION_JSON)
public class ContestController {

    @Inject
    ContestService contestService;

    @Inject
    ContestLeaderboardService contestLeaderboardService;

    @GET
    @Path("/{id}/leaderboard")
    public Response leaderboard(@PathParam("id") Long id,
                              @QueryParam("reveal") @DefaultValue("false") boolean revealAll) {
        ContestEntity contest = contestService.findById(id);
        if (contest == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("比赛不存在，id=" + id)
                    .build();
        }
        return Response.ok(contestLeaderboardService.build(id, revealAll)).build();
    }

    @GET
    @Path("/page")
    public List<ContestEntity> page(@QueryParam("page") @DefaultValue("1") int page,
                                    @QueryParam("size") @DefaultValue("10") int size) {
        return contestService.findPage(page, size);
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        ContestEntity entity = contestService.findById(id);
        if (entity == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("比赛不存在，id=" + id)
                    .build();
        }
        return Response.ok(entity).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response create(ContestEntity contest) {
        if (contest == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }
        ContestEntity created = contestService.create(contest);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response update(@PathParam("id") Long id, ContestEntity body) {
        if (body == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("请求体不能为空")
                    .build();
        }
        body.setId(id);
        ContestEntity updated = contestService.update(body);
        if (updated == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("要更新的比赛不存在，id=" + id)
                    .build();
        }
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        ContestEntity existing = contestService.findById(id);
        if (existing == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("要删除的比赛不存在，id=" + id)
                    .build();
        }
        ContestEntity deleted = contestService.delete(existing);
        return Response.ok(deleted).build();
    }
}
