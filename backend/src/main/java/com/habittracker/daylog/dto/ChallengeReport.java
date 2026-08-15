package com.habittracker.daylog.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * End-of-challenge (or in-progress) summary. Days that were never logged count as 0% in
 * {@code averagePercent} so the average reflects the whole challenge, not just the days shown up
 * for. Rest days are excluded from every count — they are planned time off, not misses.
 */
public record ChallengeReport(
        UUID challengeId,
        String title,
        int durationDays,
        LocalDate startDate,
        LocalDate endDate,
        int daysElapsed,
        int daysLogged,
        int daysMissed,
        int perfectDays,
        int averagePercent,
        int bestStreak,
        List<DayCell> days,
        List<TaskBreakdown> taskBreakdown) {

    /**
     * One cell of the day-by-day strip. {@code logged} false means no record at all;
     * {@code restDay} means the day was deliberately off and counts for nothing.
     */
    public record DayCell(
            int dayNumber, LocalDate date, int completionPercent, boolean logged, boolean future, boolean restDay) {}

    public record TaskBreakdown(UUID taskId, String title, int completedDays, int elapsedDays, int percent) {}
}
