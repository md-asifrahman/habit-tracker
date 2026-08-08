package com.habittracker.habit.dto;

import com.habittracker.habit.HabitFrequency;
import com.habittracker.habit.HabitType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record HabitRequest(
        @NotBlank String title,
        String description,
        @NotNull HabitType type,
        @NotNull HabitFrequency frequency,
        String icon,
        String color) {}
