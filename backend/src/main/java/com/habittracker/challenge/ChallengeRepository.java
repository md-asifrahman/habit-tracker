package com.habittracker.challenge;

import com.habittracker.habit.Habit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeRepository extends JpaRepository<Challenge, UUID> {

    List<Challenge> findByHabit(Habit habit);

    Optional<Challenge> findFirstByHabitAndStatusOrderByStartDateDesc(Habit habit, ChallengeStatus status);
}
