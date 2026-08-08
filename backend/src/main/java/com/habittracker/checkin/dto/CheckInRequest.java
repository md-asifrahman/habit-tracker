package com.habittracker.checkin.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CheckInRequest(@NotNull LocalDate date, boolean completed, String note) {}
