package com.habittracker.auth.dto;

public record AuthResponse(String accessToken, String refreshToken, String email, String name) {}
