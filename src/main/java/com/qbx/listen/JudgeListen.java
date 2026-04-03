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
        String endStatus = "AC";
        userCodeSubmissionService.updateStatus(submission.getId(), "RUNNING");

        for (ProblemTestSampleEntity test : testSampleList) {
            String s = null;
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
            String expectedOut = test.getExpectedOutput() != null ? test.getExpectedOutput() : "";

            String ojStatus = judgeStatus(gjStatus, stdout, expectedOut);

            if ("AC".equals(endStatus)) {
                endStatus = ojStatus;
            }

            TestResultEntity tr = new TestResultEntity();
            tr.setSubmissionId(submission.getId());
            tr.setTestSampleId(test.getId());
            int maxLength = 5000;
            if (stdout.length() > maxLength) {
                stdout = stdout.substring(0, maxLength) + "...";
            }
            tr.setActualOutput(stdout);
            tr.setStatus(ojStatus);
            tr.setTimeUsed((int) (timeNs / 1_000_000L));
            tr.setMemoryUsed((int) memBytes);
            testResultService.create(tr);
        }
        userCodeSubmissionService.updateStatus(submission.getId(), endStatus);
    }

    private String judgeStatus(String gjStatus, String actualOutput, String expectedOutput) {
        return switch (gjStatus) {
            case "Accepted" -> outputsEqual(actualOutput, expectedOutput) ? "AC" : "WA";
            case "Wrong Answer" -> "WA";
            case "Time Limit Exceeded" -> "TLE";
            case "Memory Limit Exceeded" -> "TLE";
            case "Runtime Error", "Non Zero Exit Status", "Nonzero Exit Status" -> "RE";
            case "Compilation Error" -> "CE";
            default -> "WA";
        };
    }

    private static boolean outputsEqual(String actual, String expected) {
        return normalizeOutput(actual).equals(normalizeOutput(expected));
    }

    private static String normalizeOutput(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        String unix = s.replace("\r\n", "\n").replace('\r', '\n');
        String[] lines = unix.split("\n", -1);
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < lines.length; i++) {
            if (i > 0) {
                sb.append('\n');
            }
            sb.append(trimTrailingSpaces(lines[i]));
        }
        return sb.toString().trim();
    }

    private static String trimTrailingSpaces(String line) {
        int end = line.length();
        while (end > 0) {
            char c = line.charAt(end - 1);
            if (c != ' ' && c != '\t') {
                break;
            }
            end--;
        }
        return line.substring(0, end);
    }

}