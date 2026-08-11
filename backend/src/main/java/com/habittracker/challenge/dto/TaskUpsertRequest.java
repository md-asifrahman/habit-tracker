package com.habittracker.challenge.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/** A task in an edited list. A null id means "new task"; omitted existing ids are deleted. */
public record TaskUpsertRequest(UUID id, @NotNull @Size(min = 1, max = 200) String title) {}
