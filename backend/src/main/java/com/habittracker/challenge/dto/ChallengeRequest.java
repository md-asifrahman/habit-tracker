package com.habittracker.challenge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Everything the add-challenge flow collects, submitted in one shot from the summary step. */
public record ChallengeRequest(
        @NotNull @Size(min = 1, max = 120) String title,
        @NotNull @Min(1) @Max(365) Integer durationDays,
        LocalDate startDate,
        @NotNull LocalTime reminderTime,
        @NotNull String reminderSound,
        boolean repeatEnabled,
        @NotNull @Min(5) @Max(240) Integer repeatEveryMin,
        @NotEmpty List<@NotNull @Size(min = 1, max = 200) String> tasks,
        /** ISO day-of-week numbers (1=Mon .. 7=Sun) to skip. Null or empty means every day. */
        List<@Min(1) @Max(7) Integer> restDays) {}
