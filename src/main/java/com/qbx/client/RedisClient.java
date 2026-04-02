package com.qbx.client;


import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.list.ListCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class RedisClient {

    @Inject
    RedisDataSource redis;

    public void push(String key, String msg) {
        ListCommands<String, String> list = redis.list(String.class);
        list.lpush(key, msg);
    }

    public String pull(String key) {
        ListCommands<String, String> list = redis.list(String.class);
        return list.rpop(key);   // 非阻塞
    }

}
