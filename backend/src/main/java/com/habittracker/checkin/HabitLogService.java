package com.habittracker.checkin;

import com.habittracker.checkin.dto.CheckInRequest;
import com.habittracker.checkin.dto.CheckInResponse;
import com.habittracker.checkin.dto.HabitStatsResponse;
import com.habittracker.common.exception.ApiException;
import com.habittracker.habit.Habit;
import com.habittracker.habit.HabitRepository;
import com.habittracker.security.CurrentUser;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HabitLogService {

    private final HabitLogRepository habitLogRepository;
    private final HabitRepository habitRepository;
    private final CurrentUser currentUser;

    public List<CheckInResponse> list(UUID habitId, LocalDate from, LocalDate to) {
        Habit habit = findOwnedHabit(habitId);
        List<HabitLog> logs = (from != null && to != null)
                ? habitLogRepository.findByHabitAndDateBetweenOrderByDateDesc(habit, from, to)
                : habitLogRepository.findByHabitOrderByDateDesc(habit);
        return logs.stream().map(CheckInResponse::from).toList();
    }

    public CheckInResponse checkIn(UUID habitId, CheckInRequest request) {
        Habit habit = findOwnedHabit(habitId);

        HabitLog log = habitLogRepository
                .findByHabitAndDate(habit, request.date())
                .orElseGet(HabitLog::new);
        log.setHabit(habit);
        log.setDate(request.date());
        log.setCompleted(request.completed());
        log.setNote(request.note());

        return CheckInResponse.from(habitLogRepository.save(log));
    }

    public HabitStatsResponse stats(UUID habitId) {
        Habit habit = findOwnedHabit(habitId);
        List<HabitLog> logs = habitLogRepository.findByHabitOrderByDateDesc(habit);

        long completedCount = logs.stream().filter(HabitLog::isCompleted).count();
        double completionRate = logs.isEmpty() ? 0 : (completedCount * 100.0) / logs.size();

        return new HabitStatsResponse(currentStreak(logs), longestStreak(logs), Math.round(completionRate * 10) / 10.0);
    }

    private int currentStreak(List<HabitLog> logsDesc) {
        LocalDate expected = LocalDate.now();
        int streak = 0;
        for (HabitLog log : logsDesc) {
            if (!log.isCompleted()) {
                break;
            }
            if (log.getDate().equals(expected)) {
                streak++;
                expected = expected.minusDays(1);
            } else if (log.getDate().equals(expected.minusDays(1)) && streak == 0) {
                // today not logged yet, but yesterday was completed — streak still alive
                streak++;
                expected = log.getDate().minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    private int longestStreak(List<HabitLog> logsDesc) {
        List<HabitLog> logsAsc = logsDesc.reversed();
        int longest = 0;
        int current = 0;
        LocalDate previous = null;

        for (HabitLog log : logsAsc) {
            if (!log.isCompleted()) {
                current = 0;
                previous = null;
                continue;
            }
            current = (previous != null && log.getDate().equals(previous.plusDays(1))) ? current + 1 : 1;
            longest = Math.max(longest, current);
            previous = log.getDate();
        }
        return longest;
    }

    private Habit findOwnedHabit(UUID habitId) {
        return habitRepository
                .findByIdAndUser(habitId, currentUser.get())
                .orElseThrow(() -> ApiException.notFound("Habit not found"));
    }
}
