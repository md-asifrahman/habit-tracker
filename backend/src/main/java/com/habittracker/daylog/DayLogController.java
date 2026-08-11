package com.habittracker.daylog;

import com.habittracker.daylog.dto.ChallengeReport;
import com.habittracker.daylog.dto.DayLogRequest;
import com.habittracker.daylog.dto.DayLogResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/challenges/{challengeId}")
@RequiredArgsConstructor
public class DayLogController {

    private final DayLogService dayLogService;

    @GetMapping("/logs")
    public List<DayLogResponse> list(@PathVariable UUID challengeId) {
        return dayLogService.list(challengeId);
    }

    @GetMapping("/logs/{date}")
    public DayLogResponse getDay(
            @PathVariable UUID challengeId, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return dayLogService.getDay(challengeId, date);
    }

    @PutMapping("/logs")
    public DayLogResponse logDay(@PathVariable UUID challengeId, @Valid @RequestBody DayLogRequest request) {
        return dayLogService.logDay(challengeId, request);
    }

    @GetMapping("/report")
    public ChallengeReport report(@PathVariable UUID challengeId) {
        return dayLogService.report(challengeId);
    }
}
