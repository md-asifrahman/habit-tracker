package com.habittracker.habit.dto;

import com.habittracker.habit.Habit;
import com.habittracker.habit.HabitFrequency;
import com.habittracker.habit.HabitType;
import java.util.UUID;

public record HabitResponse(
        UUID id,
        String title,
        String description,
        HabitType type,
        HabitFrequency frequency,
        String icon,
        String color,
        boolean archived) {

    public static HabitResponse from(Habit habit) {
        return new HabitResponse(
                habit.getId(),
                habit.getTitle(),
                habit.getDescription(),
                habit.getType(),
                habit.getFrequency(),
                habit.getIcon(),
                habit.getColor(),
                habit.isArchived());
    }
}
