package com.habittracker.checkin;

import com.habittracker.habit.Habit;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitLogRepository extends JpaRepository<HabitLog, UUID> {

    List<HabitLog> findByHabitAndDateBetweenOrderByDateDesc(Habit habit, LocalDate from, LocalDate to);

    List<HabitLog> findByHabitOrderByDateDesc(Habit habit);

    Optional<HabitLog> findByHabitAndDate(Habit habit, LocalDate date);
}
