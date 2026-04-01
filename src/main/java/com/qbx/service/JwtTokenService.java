package com.qbx.service;

import com.qbx.entity.UserEntity;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import jakarta.enterprise.context.ApplicationScoped;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class JwtTokenService {

    private static final Pattern USER_ID_PATTERN = Pattern.compile("\"userId\":(\\d+)");
    private static final Pattern EXP_PATTERN = Pattern.compile("\"exp\":(\\d+)");

    @ConfigProperty(name = "app.jwt.secret")
    String secret;

    @ConfigProperty(name = "app.jwt.expire-seconds", defaultValue = "7200")
    long expireSeconds;

    public String generateToken(UserEntity user) {
        long now = Instant.now().getEpochSecond();
        long exp = now + expireSeconds;

        String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payloadJson = "{"
                + "\"sub\":\"" + escape(user.getUsername()) + "\","
                + "\"userId\":" + user.getId() + ","
                + "\"userTpye\":\"" + escape(user.getUserTpye()) + "\","
                + "\"iat\":" + now + ","
                + "\"exp\":" + exp
                + "}";

        String header = base64UrlEncode(headerJson);
        String payload = base64UrlEncode(payloadJson);
        String signature = sign(header + "." + payload);
        return header + "." + payload + "." + signature;
    }

    public Long verifyAndGetUserId(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }

            String expectedSignature = sign(parts[0] + "." + parts[1]);
            if (!expectedSignature.equals(parts[2])) {
                return null;
            }

            String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            Long exp = extractLong(payloadJson, EXP_PATTERN);
            if (exp == null || Instant.now().getEpochSecond() >= exp) {
                return null;
            }

            return extractLong(payloadJson, USER_ID_PATTERN);
        } catch (Exception e) {
            return null;
        }
    }

    private String sign(String content) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            mac.init(keySpec);
            byte[] signed = mac.doFinal(content.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signed);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate jwt token", e);
        }
    }

    private String base64UrlEncode(String value) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String escape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private Long extractLong(String value, Pattern pattern) {
        Matcher matcher = pattern.matcher(value);
        if (!matcher.find()) {
            return null;
        }
        return Long.parseLong(matcher.group(1));
    }
}
