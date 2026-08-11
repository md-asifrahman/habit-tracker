package com.habittracker.daylog.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Ticking off the day. Sending an empty list is a valid "did none of it" record. */
public record DayLogRequest(@NotNull LocalDate date, @NotNull List<UUID> completedTaskIds, String note) {}
