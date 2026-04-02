package com.qbx.listen;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.qbx.client.GoJudgeClient;
import com.qbx.client.RedisClient;
import com.qbx.constant.RedisConstant;
import com.qbx.entity.ProblemDetailEntity;
import com.qbx.entity.ProblemTestSampleEntity;
import com.qbx.entity.TestResultEntity;
import com.qbx.entity.UserCodeSubmissionEntity;
import com.qbx.service.ProblemDetailService;
import com.qbx.service.ProblemTestSampleService;
import com.qbx.service.TestResultService;
import com.qbx.service.UserCodeSubmissionService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class JudgeListen {

    @Inject
    RedisClient redisClient;

    @Inject
    GoJudgeClient goJudgeClient;

    @Inject
    ObjectMapper mapper;

    @Inject
    ProblemDetailService problemDetailService;

    @Inject
    UserCodeSubmissionService userCodeSubmissionService;

    @Inject
    ProblemTestSampleService problemTestSampleService;

    @Inject
    TestResultService testResultService;

    @Scheduled(every = "1s")
    public void poll() {
        try {
            String msg = redisClient.pull(RedisConstant.JUDGE_QUEUE);
            if (msg != null) {
                System.out.println("执行任务");
                task(msg);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void task(String msg) throws JsonProcessingException {
        System.out.println("执行监听任务");
        UserCodeSubmissionEntity submission = mapper.readValue(msg, UserCodeSubmissionEntity.class);
        userCodeSubmissionService.updateStatus(submission.getId(), "JUDGING");
        ProblemDetailEntity detail = problemDetailService.findById(submission.getProblemId());
        List<ProblemTestSampleEntity> testSampleList = problemTestSampleService.findByProblemId(submission.getProblemId());
        userCodeSubmissionService.updateStatus(submission.getId(), "RUNNING");
            for (ProblemTestSampleEntity test : testSampleList) {
                String s=null;
                if (submission.getLanguage().equals("python")) {
                    s = goJudgeClient.runPython(submission.getCode(), test.getInput(),
                            detail.getTimeLimit(), detail.getMemoryLimit());
                }
                if (submission.getLanguage().equals("java")) {
                    s = goJudgeClient.runJava(submission.getCode(), test.getInput(),
                            detail.getTimeLimit(), detail.getMemoryLimit());
                }
                if (submission.getLanguage().equals("cpp")) {
                    s = goJudgeClient.runCpp(submission.getCode(), test.getInput(),
                            detail.getTimeLimit(), detail.getMemoryLimit());
                }
                JsonNode arr = mapper.readTree(s);
                if (!arr.isArray() || arr.isEmpty()) {
                    System.out.println("判题返回非数组或为空: " + s);
                    continue;
                }
                JsonNode node = arr.get(0);
                String gjStatus = node.path("status").asText("");
                String stdout = node.path("files").path("stdout").asText("");
                long timeNs = node.path("time").asLong(0L);
                long memBytes = node.path("memory").asLong(0L);

                String ojStatus;
                switch (gjStatus) {
                    case "Accepted":
                        ojStatus = "AC";
                        break;
                    case "Wrong Answer":
                        ojStatus = "WA";
                        break;
                    case "Time Limit Exceeded":
                        ojStatus = "TLE";
                        break;
                    case "Memory Limit Exceeded":
                        ojStatus = "TLE";
                        break;
                    case "Runtime Error":
                    case "Non Zero Exit Status":
                        ojStatus = "RE";
                        break;
                    case "Compilation Error":
                        ojStatus = "CE";
                        break;
                    default:
                        ojStatus = "WA";
                        break;
                }
                userCodeSubmissionService.updateStatus(submission.getId(), ojStatus);
                TestResultEntity tr = new TestResultEntity();
                tr.setSubmissionId(submission.getId());
                tr.setTestSampleId(test.getId());
                tr.setActualOutput(stdout);
                tr.setStatus(ojStatus);
                tr.setTimeUsed((int) Math.min(timeNs / 1_000_000L, Integer.MAX_VALUE));
                tr.setMemoryUsed((int) Math.min(memBytes, Integer.MAX_VALUE));
                testResultService.create(tr);
        }
    }

}
