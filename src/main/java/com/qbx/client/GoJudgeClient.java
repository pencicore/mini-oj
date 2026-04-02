package com.qbx.client;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class GoJudgeClient {

    @ConfigProperty(name = "go-judge.base-url")
    String baseUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper()
            .setSerializationInclusion(JsonInclude.Include.NON_NULL);

    /**
     * 执行 Python 代码
     *
     * @param sourceCode 源代码
     * @param input 输入
     * @param timeLimitMs 时间限制（毫秒）
     * @param memoryLimitMb 内存限制（MB）
     */
    public String runPython(String sourceCode, String input, Integer timeLimitMs, Integer memoryLimitMb) {
        long cpuLimit = toCpuLimitNs(timeLimitMs);
        long clockLimit = toClockLimitNs(timeLimitMs);
        long memoryLimit = toMemoryLimitBytes(memoryLimitMb);

        Cmd cmd = new Cmd();
        cmd.args = List.of("/usr/bin/python3", "main.py");
        cmd.env = List.of("PATH=/usr/bin:/bin");
        cmd.files = List.of(
                FileItem.stdin(input),
                FileItem.stdout(),
                FileItem.stderr()
        );
        cmd.cpuLimit = cpuLimit;
        cmd.clockLimit = clockLimit;
        cmd.memoryLimit = memoryLimit;
        cmd.copyIn = Map.of(
                "main.py", CopyInFile.content(sourceCode)
        );
        cmd.copyOut = List.of("stdout", "stderr");
        cmd.procLimit = 50;

        RunRequest request = new RunRequest();
        request.cmd = List.of(cmd);

        return doRun(request);
    }

    /**
     * 执行 C++ 代码（编译 + 运行）
     *
     * @param sourceCode 源代码
     * @param input 输入
     * @param timeLimitMs 运行时间限制（毫秒）
     * @param memoryLimitMb 运行内存限制（MB）
     */
    public String runCpp(String sourceCode, String input, Integer timeLimitMs, Integer memoryLimitMb) {
        try {
            // 编译阶段限制：固定大一点
            long compileCpuLimit = 10_000_000_000L;       // 10s
            long compileClockLimit = 20_000_000_000L;     // 20s
            long compileMemoryLimit = 512L * 1024 * 1024; // 512MB

            // 运行阶段限制：由参数决定
            long runCpuLimit = toCpuLimitNs(timeLimitMs);
            long runClockLimit = toClockLimitNs(timeLimitMs);
            long runMemoryLimit = toMemoryLimitBytes(memoryLimitMb);

            // 1. 编译
            Cmd compileCmd = new Cmd();
            compileCmd.args = List.of("/usr/bin/g++", "main.cpp", "-O2", "-std=c++17", "-o", "main");
            compileCmd.env = List.of("PATH=/usr/bin:/bin");
            compileCmd.files = List.of(
                    FileItem.stdin(""),
                    FileItem.stdout(),
                    FileItem.stderr()
            );
            compileCmd.cpuLimit = compileCpuLimit;
            compileCmd.clockLimit = compileClockLimit;
            compileCmd.memoryLimit = compileMemoryLimit;
            compileCmd.procLimit = 50;
            compileCmd.copyIn = Map.of(
                    "main.cpp", CopyInFile.content(sourceCode)
            );
            compileCmd.copyOut = List.of("stdout", "stderr");
            compileCmd.copyOutCached = List.of("main");

            RunRequest compileRequest = new RunRequest();
            compileRequest.cmd = List.of(compileCmd);

            String compileResponseJson = doRun(compileRequest);

            List<Map<String, Object>> compileResults = objectMapper.readValue(
                    compileResponseJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
            );

            if (compileResults == null || compileResults.isEmpty()) {
                throw new RuntimeException("go-judge C++ 编译返回为空: " + compileResponseJson);
            }

            Map<String, Object> compileResult = compileResults.get(0);

            String status = (String) compileResult.get("status");
            if (!"Accepted".equals(status)) {
                return compileResponseJson;
            }

            @SuppressWarnings("unchecked")
            Map<String, String> fileIds = (Map<String, String>) compileResult.get("fileIds");
            if (fileIds == null || !fileIds.containsKey("main")) {
                return compileResponseJson;
            }

            String executableFileId = fileIds.get("main");

            // 2. 运行
            Cmd runCmd = new Cmd();
            runCmd.args = List.of("./main");
            runCmd.env = List.of("PATH=/usr/bin:/bin");
            runCmd.files = List.of(
                    FileItem.stdin(input),
                    FileItem.stdout(),
                    FileItem.stderr()
            );
            runCmd.cpuLimit = runCpuLimit;
            runCmd.clockLimit = runClockLimit;
            runCmd.memoryLimit = runMemoryLimit;
            runCmd.procLimit = 50;
            runCmd.copyIn = Map.of(
                    "main", CopyInFile.fileId(executableFileId)
            );
            runCmd.copyOut = List.of("stdout", "stderr");

            RunRequest runRequest = new RunRequest();
            runRequest.cmd = List.of(runCmd);

            return doRun(runRequest);

        } catch (Exception e) {
            throw new RuntimeException("执行 C++ 代码失败: " + e.getMessage(), e);
        }
    }

    /**
     * 执行 Java 代码（编译 + 运行）
     * 约定用户类名为 Main
     *
     * @param sourceCode 源代码
     * @param input 输入
     * @param timeLimitMs 运行时间限制（毫秒）
     * @param memoryLimitMb 运行内存限制（MB）
     */
    public String runJava(String sourceCode, String input, Integer timeLimitMs, Integer memoryLimitMb) {
        try {
            // 编译阶段限制：固定大一点
            long compileCpuLimit = 10_000_000_000L;       // 10s
            long compileClockLimit = 20_000_000_000L;     // 20s
            long compileMemoryLimit = 512L * 1024 * 1024; // 512MB

            // 运行阶段限制：由参数决定
            long runCpuLimit = toCpuLimitNs(timeLimitMs);
            long runClockLimit = toClockLimitNs(timeLimitMs);
            long runMemoryLimit = toMemoryLimitBytes(memoryLimitMb);

            // 1. 编译
            Cmd compileCmd = new Cmd();
            compileCmd.args = List.of("/usr/bin/javac", "Main.java");
            compileCmd.env = List.of("PATH=/usr/bin:/bin");
            compileCmd.files = List.of(
                    FileItem.stdin(""),
                    FileItem.stdout(),
                    FileItem.stderr()
            );
            compileCmd.cpuLimit = compileCpuLimit;
            compileCmd.clockLimit = compileClockLimit;
            compileCmd.memoryLimit = compileMemoryLimit;
            compileCmd.procLimit = 50;
            compileCmd.copyIn = Map.of(
                    "Main.java", CopyInFile.content(sourceCode)
            );
            compileCmd.copyOut = List.of("stdout", "stderr");
            compileCmd.copyOutCached = List.of("Main.class");

            RunRequest compileRequest = new RunRequest();
            compileRequest.cmd = List.of(compileCmd);

            String compileResponseJson = doRun(compileRequest);

            List<Map<String, Object>> compileResults = objectMapper.readValue(
                    compileResponseJson,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class)
            );

            if (compileResults == null || compileResults.isEmpty()) {
                throw new RuntimeException("go-judge Java 编译返回为空: " + compileResponseJson);
            }

            Map<String, Object> compileResult = compileResults.get(0);

            String status = (String) compileResult.get("status");
            if (!"Accepted".equals(status)) {
                return compileResponseJson;
            }

            Map<String, String> fileIds = (Map<String, String>) compileResult.get("fileIds");
            if (fileIds == null || !fileIds.containsKey("Main.class")) {
                return compileResponseJson;
            }

            String classFileId = fileIds.get("Main.class");

            // 2. 运行
            Cmd runCmd = new Cmd();
            runCmd.args = List.of("/usr/bin/java", "Main");
            runCmd.env = List.of("PATH=/usr/bin:/bin");
            runCmd.files = List.of(
                    FileItem.stdin(input),
                    FileItem.stdout(),
                    FileItem.stderr()
            );
            runCmd.cpuLimit = runCpuLimit;
            runCmd.clockLimit = runClockLimit;
            runCmd.memoryLimit = runMemoryLimit;
            runCmd.procLimit = 50;
            runCmd.copyIn = Map.of(
                    "Main.class", CopyInFile.fileId(classFileId)
            );
            runCmd.copyOut = List.of("stdout", "stderr");

            RunRequest runRequest = new RunRequest();
            runRequest.cmd = List.of(runCmd);

            return doRun(runRequest);

        } catch (Exception e) {
            throw new RuntimeException("执行 Java 代码失败: " + e.getMessage(), e);
        }
    }

    /**
     * 最底层执行方法
     */
    public String doRun(RunRequest requestBody) {
        try {
            String json = objectMapper.writeValueAsString(requestBody);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/run"))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(60))
                    .POST(HttpRequest.BodyPublishers.ofString(json))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("go-judge 请求失败, status=" + response.statusCode() + ", body=" + response.body());
            }

            return response.body();
        } catch (JsonProcessingException e) {
            throw new RuntimeException("请求 JSON 序列化失败", e);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException("调用 go-judge 失败", e);
        }
    }

    /**
     * 毫秒 -> ns
     */
    private long toCpuLimitNs(Integer timeLimitMs) {
        if (timeLimitMs == null || timeLimitMs <= 0) {
            throw new IllegalArgumentException("timeLimitMs 必须大于 0");
        }
        return timeLimitMs * 1_000_000L;
    }

    /**
     * wall clock 一般给 cpuLimit 的 3 倍
     */
    private long toClockLimitNs(Integer timeLimitMs) {
        return toCpuLimitNs(timeLimitMs) * 3;
    }

    /**
     * MB -> byte
     */
    private long toMemoryLimitBytes(Integer memoryLimitMb) {
        if (memoryLimitMb == null || memoryLimitMb <= 0) {
            throw new IllegalArgumentException("memoryLimitMb 必须大于 0");
        }
        return memoryLimitMb * 1024L * 1024L;
    }

    public static class RunRequest {
        public List<Cmd> cmd;
    }

    public static class Cmd {
        public List<String> args;
        public List<String> env;
        public List<FileItem> files;
        public Long cpuLimit;
        public Long clockLimit;
        public Long memoryLimit;
        public Integer procLimit;
        public Map<String, CopyInFile> copyIn;
        public List<String> copyOut;
        public List<String> copyOutCached;
    }

    public static class FileItem {
        public String content;
        public String name;
        public Integer max;

        public static FileItem stdin(String input) {
            FileItem item = new FileItem();
            item.content = input == null ? "" : input;
            return item;
        }

        public static FileItem stdout() {
            FileItem item = new FileItem();
            item.name = "stdout";
            item.max = 1024 * 1024;
            return item;
        }

        public static FileItem stderr() {
            FileItem item = new FileItem();
            item.name = "stderr";
            item.max = 1024 * 1024;
            return item;
        }
    }

    public static class CopyInFile {
        public String content;
        public String fileId;

        public static CopyInFile content(String content) {
            CopyInFile file = new CopyInFile();
            file.content = content;
            return file;
        }

        public static CopyInFile fileId(String fileId) {
            CopyInFile file = new CopyInFile();
            file.fileId = fileId;
            return file;
        }
    }

}