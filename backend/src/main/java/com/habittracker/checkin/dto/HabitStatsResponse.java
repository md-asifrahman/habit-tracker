package com.habittracker.checkin.dto;

public record HabitStatsResponse(int currentStreak, int longestStreak, double completionRate) {}
