package com.spring.codeamigosbackend.OAuth2.util;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
@Component
public class JwtUtil {
    private static final String SECRET_KEY = "e905db59b4ed608f3df6625b18b22e497e22e0b02ea89f9f55edb8b2b88ab5221d4bb31f9035d521920225b39b55178abd444ee05d8aac8c86810bda17eb3efebce9ca439f4afad1925a6f8ca58e99291f2955ed142426022b795ca792559aff9b4a3fc45a37aeb299d7a2425dd6760ead76f72b7372b623c6ff9f80e871e6a20b05a8f60ed56230365a6a909bdbfd84546a7fa256112092366b45b426d89e830195adb442260db07a1b40d4d279da95b2506de0b69c56ec9a6a402d06d69b0e2c1b16fa4504211b0154ed93345593cc1fcb01ff4c05afe9da225423dfa857417716d559a93ff8227fc0a45f8bd95b9b09244d68b256697abb5678cee3ce612e"; // Store in env variable
    private static final SecretKey KEY = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
    private static final long EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 1 hour

    public static String generateToken(String id, String username, String email,String status) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", id);
        claims.put("username", username);
        claims.put("status",status);
        claims.put("email", email);

        return Jwts.builder()
                .setSubject(id)
                .addClaims(claims)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
                .signWith(KEY, SignatureAlgorithm.HS256)
                .compact();
    }

    public static Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(KEY)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }



    public static String getUserIdFromToken(String token) {
        return validateToken(token).getSubject();
    }
}