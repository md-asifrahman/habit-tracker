package com.habittracker.challenge.dto;

import com.habittracker.challenge.ChallengeTask;
import java.util.UUID;

public record TaskResponse(UUID id, String title, int sortOrder) {

    public static TaskResponse from(ChallengeTask task) {
        return new TaskResponse(task.getId(), task.getTitle(), task.getSortOrder());
    }
}
