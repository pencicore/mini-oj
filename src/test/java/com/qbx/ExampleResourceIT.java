package com.qbx;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qbx.client.RedisClient;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

//@QuarkusTest
class ExampleResourceIT extends ExampleResourceTest {

    @Inject
    RedisClient redisClient;

    @Inject
    ObjectMapper mapper;

    static class RedisTask {
        private Integer id;
        private String description;

        public RedisTask() {
        }

        public RedisTask(Integer id, String description) {
            this.id = id;
            this.description = description;
        }

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        @Override
        public String toString() {
            return "RedisTask{id=" + id + ", description='" + description + "'}";
        }
    }

    @Test
    void redisTest() throws JsonProcessingException {
        RedisTask redisTask = new RedisTask(1, "Redis Test");

        String json = mapper.writeValueAsString(redisTask);
        redisClient.push("test", json);

        String msg = redisClient.pull("test");
        if (msg == null) {
            throw new RuntimeException("Redis 中没有取到消息");
        }

        RedisTask task = mapper.readValue(msg, RedisTask.class);
        System.out.println(task);
    }
}