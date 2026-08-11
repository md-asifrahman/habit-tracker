package com.habittracker.daylog.dto;

import com.habittracker.daylog.DayLog;
import com.habittracker.daylog.DayTaskLog;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DayLogResponse(
        UUID id,
        LocalDate date,
        int completionPercent,
        int completedCount,
        int taskCount,
        String note,
        List<UUID> completedTaskIds,
        /** Used by the mobile client to decide which side of a sync is newer. */
        java.time.Instant updatedAt) {

    public static DayLogResponse from(DayLog log) {
        return new DayLogResponse(
                log.getId(),
                log.getDate(),
                log.getCompletionPercent(),
                log.getCompletedCount(),
                log.getTaskCount(),
                log.getNote(),
                log.getTaskLogs().stream()
                        .filter(DayTaskLog::isDone)
                        .map(taskLog -> taskLog.getTask().getId())
                        .toList(),
                log.getUpdatedAt());
    }
}
