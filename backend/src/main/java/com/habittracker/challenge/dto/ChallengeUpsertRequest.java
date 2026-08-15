package com.habittracker.challenge.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * The whole challenge in one payload, used by the mobile client to push a locally-created or
 * locally-edited challenge under an id it already chose. Tasks carry their ids too, so day logs
 * that reference them survive the round trip.
 */
public record ChallengeUpsertRequest(
        @NotNull @Size(min = 1, max = 120) String title,
        @NotNull @Min(1) @Max(365) Integer durationDays,
        @NotNull LocalDate startDate,
        @NotNull com.habittracker.challenge.ChallengeStatus status,
        @NotNull LocalTime reminderTime,
        @NotNull String reminderSound,
        boolean repeatEnabled,
        @NotNull @Min(5) @Max(240) Integer repeatEveryMin,
        @NotEmpty List<@Valid TaskUpsertRequest> tasks,
        /** ISO day-of-week numbers (1=Mon .. 7=Sun) to skip. Null or empty means every day. */
        List<@Min(1) @Max(7) Integer> restDays) {}
