package com.habittracker.challenge.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ChallengeRequest(@NotNull @Min(1) Integer durationDays) {}
