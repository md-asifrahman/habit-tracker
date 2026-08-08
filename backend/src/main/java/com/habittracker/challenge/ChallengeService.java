package com.habittracker.challenge;

import com.habittracker.common.exception.ApiException;
import com.habittracker.challenge.dto.ChallengeRequest;
import com.habittracker.challenge.dto.ChallengeResponse;
import com.habittracker.habit.Habit;
import com.habittracker.habit.HabitRepository;
import com.habittracker.security.CurrentUser;
import java.time.LocalDate;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final HabitRepository habitRepository;
    private final CurrentUser currentUser;

    public ChallengeResponse getActive(UUID habitId) {
        Habit habit = findOwnedHabit(habitId);
        Challenge challenge = challengeRepository
                .findFirstByHabitAndStatusOrderByStartDateDesc(habit, ChallengeStatus.ACTIVE)
                .orElseThrow(() -> ApiException.notFound("No active challenge for this habit"));
        return ChallengeResponse.from(challenge);
    }

    public ChallengeResponse start(UUID habitId, ChallengeRequest request) {
        Habit habit = findOwnedHabit(habitId);

        challengeRepository
                .findFirstByHabitAndStatusOrderByStartDateDesc(habit, ChallengeStatus.ACTIVE)
                .ifPresent(existing -> {
                    throw ApiException.conflict("This habit already has an active challenge");
                });

        Challenge challenge = new Challenge();
        challenge.setHabit(habit);
        challenge.setDurationDays(request.durationDays());
        challenge.setStartDate(LocalDate.now());
        challenge.setEndDate(LocalDate.now().plusDays(request.durationDays() - 1L));
        challenge.setStatus(ChallengeStatus.ACTIVE);

        return ChallengeResponse.from(challengeRepository.save(challenge));
    }

    private Habit findOwnedHabit(UUID habitId) {
        return habitRepository
                .findByIdAndUser(habitId, currentUser.get())
                .orElseThrow(() -> ApiException.notFound("Habit not found"));
    }
}
