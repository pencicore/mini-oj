package com.qbx.auth;

import com.qbx.service.JwtTokenService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthFilter implements ContainerRequestFilter, ContainerResponseFilter {

    private static final Map<String, Set<String>> AUTH_USER_MAP = Map.of(
            "/userCodeSubmissions", Set.of("POST", "GET"),
            "/contestActions", Set.of("POST", "GET", "PUT", "DELETE")
    );

    private static final Map<String, Set<String>> AUTH_ADMIN_MAP = Map.of(
            "/problemDetails", Set.of("POST", "PUT", "DELETE"),
            "/problemTestSamples", Set.of("POST", "PUT", "DELETE"),
            "/contests", Set.of("POST", "PUT", "DELETE")
    );

    @Inject
    JwtTokenService jwtTokenService;
    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        UserContext.clear();

        String path = requestContext.getUriInfo().getPath();
        String method = requestContext.getMethod();

        if (!(requiresAuthUser(method, path) || requiresAuthAdmin(method, path))) {
            return;
        }

        String authorization = requestContext.getHeaderString("Authorization");

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                    .entity("未登录或 token 缺失")
                    .build());
            return;
        }

        String token = authorization.substring(7);

        Long userId = jwtTokenService.verifyAndGetUserId(token);

        if (userId == null) {
            requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                    .entity("token 无效或已过期")
                    .build());
            return;
        }

        //TODO 管理员鉴权后面再说
        System.out.println("用户访问id="+userId);

        UserContext.setCurrentUserId(userId);
    }

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        UserContext.clear();
    }

    boolean requiresAuthUser(String method, String path) {
        for (var entry : AUTH_USER_MAP.entrySet()) {
            if (path.startsWith(entry.getKey()) && entry.getValue().contains(method)) {
                return true;
            }
        }
        return false;
    }


    boolean requiresAuthAdmin(String method, String path) {
        for (var entry : AUTH_ADMIN_MAP.entrySet()) {
            if (path.startsWith(entry.getKey()) && entry.getValue().contains(method)) {
                return true;
            }
        }
        return false;
    }
}
