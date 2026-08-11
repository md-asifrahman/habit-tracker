package com.habittracker.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    /** Access tokens authenticate API calls; refresh tokens may only be exchanged for new pairs. */
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    /** HS256 needs at least 256 bits of key material to be worth anything. */
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey signingKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;

    public JwtService(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.access-token-expiration-ms}") long accessTokenExpirationMs,
            @Value("${app.jwt.refresh-token-expiration-ms}") long refreshTokenExpirationMs) {
        this.signingKey = resolveKey(secret);
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
    }

    /**
     * No shipped default secret: a signing key committed to the repository would let anyone who
     * has seen the source mint a token for any account. With none configured we generate a random
     * one for this process, which keeps local development working while making it impossible to
     * deploy accidentally with a known key.
     */
    private static SecretKey resolveKey(String secret) {
        if (secret == null || secret.isBlank()) {
            log.warn(
                    "app.jwt.secret is not set — generating a random signing key for this run. "
                            + "Everyone will be signed out when the process restarts. "
                            + "Set the JWT_SECRET environment variable for any real deployment.");
            return Jwts.SIG.HS256.key().build();
        }
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "app.jwt.secret must be at least " + MIN_SECRET_BYTES + " bytes; got " + keyBytes.length);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(UUID userId, String email, int tokenVersion) {
        return buildToken(userId, email, accessTokenExpirationMs, TYPE_ACCESS, tokenVersion);
    }

    public String generateRefreshToken(UUID userId, String email, int tokenVersion) {
        return buildToken(userId, email, refreshTokenExpirationMs, TYPE_REFRESH, tokenVersion);
    }

    private String buildToken(UUID userId, String email, long expirationMs, String tokenType, int tokenVersion) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId.toString())
                .claim("type", tokenType)
                .claim("ver", tokenVersion)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey)
                .compact();
    }

    public Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public int extractTokenVersion(String token) {
        Integer version = parseClaims(token).get("ver", Integer.class);
        return version != null ? version : 0;
    }

    /**
     * Valid signature, not expired, <em>and</em> the kind of token the caller expected. Without the
     * type check a long-lived refresh token would work as an access token, and an access token
     * could be replayed at the refresh endpoint to renew itself indefinitely.
     */
    public boolean isTokenValid(String token, String expectedType) {
        try {
            Claims claims = parseClaims(token);
            return claims.getExpiration().after(new Date()) && expectedType.equals(claims.get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }
}
