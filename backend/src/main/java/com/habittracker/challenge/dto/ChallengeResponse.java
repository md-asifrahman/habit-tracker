package com.habittracker.challenge.dto;

import com.habittracker.challenge.Challenge;
import com.habittracker.challenge.ChallengeStatus;
import java.time.LocalDate;
import java.util.UUID;

public record ChallengeResponse(
        UUID id, int durationDays, LocalDate startDate, LocalDate endDate, ChallengeStatus status, int dayNumber) {

    public static ChallengeResponse from(Challenge challenge) {
        int dayNumber = (int) java.time.temporal.ChronoUnit.DAYS.between(challenge.getStartDate(), LocalDate.now()) + 1;
        dayNumber = Math.max(1, Math.min(dayNumber, challenge.getDurationDays()));
        return new ChallengeResponse(
                challenge.getId(),
                challenge.getDurationDays(),
                challenge.getStartDate(),
                challenge.getEndDate(),
                challenge.getStatus(),
                dayNumber);
    }
}
