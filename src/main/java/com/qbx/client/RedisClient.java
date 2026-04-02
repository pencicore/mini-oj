package com.qbx.client;


import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.list.ListCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.Duration;

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
        var result = list.brpop(Duration.ofDays(0), key); // 阻塞
        if (result != null) return result.value();
        return null;
    }

}
