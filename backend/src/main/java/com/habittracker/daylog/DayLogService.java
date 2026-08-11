package com.habittracker.daylog;

import com.habittracker.challenge.Challenge;
import com.habittracker.challenge.ChallengeService;
import com.habittracker.challenge.ChallengeTask;
import com.habittracker.common.RequestZone;
import com.habittracker.common.exception.ApiException;
import com.habittracker.daylog.dto.ChallengeReport;
import com.habittracker.daylog.dto.DayLogRequest;
import com.habittracker.daylog.dto.DayLogResponse;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DayLogService {

    private final DayLogRepository dayLogRepository;
    private final ChallengeService challengeService;
    private final RequestZone requestZone;

    @Transactional
    public List<DayLogResponse> list(UUID challengeId) {
        Challenge challenge = challengeService.findOwned(challengeId);
        return dayLogRepository.findByChallengeOrderByDateAsc(challenge).stream()
                .map(DayLogResponse::from)
                .toList();
    }

    @Transactional
    public DayLogResponse getDay(UUID challengeId, LocalDate date) {
        Challenge challenge = challengeService.findOwned(challengeId);
        return dayLogRepository
                .findByChallengeAndDate(challenge, date)
                .map(DayLogResponse::from)
                .orElseThrow(() -> ApiException.notFound("No log for that day"));
    }

    /** Creates or overwrites the log for a day. Ticking fewer than all tasks is fine — it's a percentage. */
    @Transactional
    public DayLogResponse logDay(UUID challengeId, DayLogRequest request) {
        Challenge challenge = challengeService.findOwned(challengeId);

        if (request.date().isBefore(challenge.getStartDate()) || request.date().isAfter(challenge.getEndDate())) {
            throw ApiException.badRequest("That date is outside the challenge window");
        }
        if (request.date().isAfter(requestZone.today())) {
            throw ApiException.badRequest("Cannot log a day in the future");
        }

        List<ChallengeTask> tasks = challenge.getTasks();
        Set<UUID> taskIds = tasks.stream().map(ChallengeTask::getId).collect(java.util.stream.Collectors.toSet());
        Set<UUID> completed = new HashSet<>(request.completedTaskIds());
        if (!taskIds.containsAll(completed)) {
            throw ApiException.badRequest("Task list contains a task that isn't part of this challenge");
        }

        DayLog log = dayLogRepository
                .findByChallengeAndDate(challenge, request.date())
                .orElseGet(() -> {
                    DayLog fresh = new DayLog();
                    fresh.setChallenge(challenge);
                    fresh.setDate(request.date());
                    return fresh;
                });

        log.getTaskLogs().clear();
        for (ChallengeTask task : tasks) {
            DayTaskLog taskLog = new DayTaskLog();
            taskLog.setTask(task);
            taskLog.setDone(completed.contains(task.getId()));
            log.addTaskLog(taskLog);
        }

        log.setNote(request.note());
        log.setTaskCount(tasks.size());
        log.setCompletedCount(completed.size());
        log.setCompletionPercent(percent(completed.size(), tasks.size()));

        return DayLogResponse.from(dayLogRepository.save(log));
    }

    @Transactional
    public ChallengeReport report(UUID challengeId) {
        Challenge challenge = challengeService.refreshStatus(challengeService.findOwned(challengeId));
        List<DayLog> logs = dayLogRepository.findByChallengeOrderByDateAsc(challenge);
        Map<LocalDate, DayLog> byDate = new HashMap<>();
        logs.forEach(log -> byDate.put(log.getDate(), log));

        LocalDate today = requestZone.today();
        // Days that have already happened — the denominator for averages and missed days.
        int elapsed = (int) Math.max(
                0,
                Math.min(
                        ChronoUnit.DAYS.between(challenge.getStartDate(), today) + 1,
                        challenge.getDurationDays()));

        List<ChallengeReport.DayCell> days = new ArrayList<>();
        int percentSum = 0;
        int perfectDays = 0;
        int bestStreak = 0;
        int runningStreak = 0;

        for (int i = 0; i < challenge.getDurationDays(); i++) {
            LocalDate date = challenge.getStartDate().plusDays(i);
            boolean future = i >= elapsed;
            DayLog log = byDate.get(date);
            int pct = log != null ? log.getCompletionPercent() : 0;

            if (!future) {
                percentSum += pct;
                if (pct == 100) {
                    perfectDays++;
                    runningStreak++;
                    bestStreak = Math.max(bestStreak, runningStreak);
                } else {
                    runningStreak = 0;
                }
            }
            days.add(new ChallengeReport.DayCell(i + 1, date, pct, log != null, future));
        }

        List<ChallengeReport.TaskBreakdown> breakdown = new ArrayList<>();
        for (ChallengeTask task : challenge.getTasks()) {
            int done = (int) logs.stream()
                    .flatMap(log -> log.getTaskLogs().stream())
                    .filter(taskLog -> taskLog.isDone() && taskLog.getTask().getId().equals(task.getId()))
                    .count();
            breakdown.add(new ChallengeReport.TaskBreakdown(
                    task.getId(), task.getTitle(), done, elapsed, percent(done, elapsed)));
        }

        int daysLogged = (int) logs.stream()
                .filter(log -> !log.getDate().isAfter(today))
                .count();

        return new ChallengeReport(
                challenge.getId(),
                challenge.getTitle(),
                challenge.getDurationDays(),
                challenge.getStartDate(),
                challenge.getEndDate(),
                elapsed,
                daysLogged,
                elapsed - daysLogged,
                perfectDays,
                elapsed == 0 ? 0 : Math.round((float) percentSum / elapsed),
                bestStreak,
                days,
                breakdown);
    }

    private static int percent(int done, int total) {
        return total == 0 ? 0 : Math.round((float) done * 100 / total);
    }
}
