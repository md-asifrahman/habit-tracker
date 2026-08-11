package com.habittracker.auth;

import com.habittracker.auth.dto.AuthResponse;
import com.habittracker.auth.dto.LoginRequest;
import com.habittracker.auth.dto.RefreshRequest;
import com.habittracker.auth.dto.RegisterRequest;
import com.habittracker.common.RequestZone;
import com.habittracker.common.exception.ApiException;
import com.habittracker.security.JwtService;
import com.habittracker.user.User;
import com.habittracker.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RequestZone requestZone;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw ApiException.conflict("An account with this email already exists");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setName(request.name());
        user.setTimezone(requestZone.get().getId());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));

        // Signing in from a new place is the moment to learn where the user actually is.
        String zone = requestZone.get().getId();
        if (!zone.equals(user.getTimezone())) {
            user.setTimezone(zone);
            userRepository.save(user);
        }

        return buildAuthResponse(user);
    }

    public AuthResponse refresh(RefreshRequest request) {
        // Must actually be a refresh token: an access token replayed here would let a caller
        // renew itself forever from a single 15-minute leak.
        if (!jwtService.isTokenValid(request.refreshToken(), JwtService.TYPE_REFRESH)) {
            throw ApiException.unauthorized("Invalid or expired refresh token");
        }

        String email = jwtService.extractEmail(request.refreshToken());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        if (user.getTokenVersion() != jwtService.extractTokenVersion(request.refreshToken())) {
            throw ApiException.unauthorized("This session has been signed out");
        }

        return buildAuthResponse(user);
    }

    /** Invalidates every token already issued for the account — use after losing a device. */
    public void revokeAllSessions(User user) {
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getTokenVersion());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getEmail(), user.getTokenVersion());
        return new AuthResponse(accessToken, refreshToken, user.getEmail(), user.getName());
    }
}
