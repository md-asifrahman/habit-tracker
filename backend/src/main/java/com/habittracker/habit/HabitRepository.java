package com.habittracker.habit;

import com.habittracker.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HabitRepository extends JpaRepository<Habit, UUID> {

    List<Habit> findByUserAndArchivedFalse(User user);

    Optional<Habit> findByIdAndUser(UUID id, User user);
}
