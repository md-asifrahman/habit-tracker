package com.habittracker.checkin.dto;

import com.habittracker.checkin.HabitLog;
import java.time.LocalDate;
import java.util.UUID;

public record CheckInResponse(UUID id, LocalDate date, boolean completed, String note) {

    public static CheckInResponse from(HabitLog log) {
        return new CheckInResponse(log.getId(), log.getDate(), log.isCompleted(), log.getNote());
    }
}
