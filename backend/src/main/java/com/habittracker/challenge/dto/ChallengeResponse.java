package com.habittracker.challenge.dto;

import com.habittracker.challenge.Challenge;
import com.habittracker.challenge.ChallengeStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

public record ChallengeResponse(
        UUID id,
        String title,
        int durationDays,
        LocalDate startDate,
        LocalDate endDate,
        ChallengeStatus status,
        int dayNumber,
        LocalTime reminderTime,
        String reminderSound,
        boolean repeatEnabled,
        int repeatEveryMin,
        List<TaskResponse> tasks,
        /** Used by the mobile client to decide which side of a sync is newer. */
        java.time.Instant updatedAt) {

    public static ChallengeResponse from(Challenge challenge, LocalDate today) {
        return new ChallengeResponse(
                challenge.getId(),
                challenge.getTitle(),
                challenge.getDurationDays(),
                challenge.getStartDate(),
                challenge.getEndDate(),
                challenge.getStatus(),
                dayNumber(challenge, today),
                challenge.getReminderTime(),
                challenge.getReminderSound(),
                challenge.isRepeatEnabled(),
                challenge.getRepeatEveryMin(),
                challenge.getTasks().stream().map(TaskResponse::from).toList(),
                challenge.getUpdatedAt());
    }

    /** 1-based day of the challenge that today falls on, clamped to the challenge window. */
    public static int dayNumber(Challenge challenge, LocalDate today) {
        long elapsed = ChronoUnit.DAYS.between(challenge.getStartDate(), today);
        return (int) Math.max(1, Math.min(elapsed + 1, challenge.getDurationDays()));
    }
}
