package com.habittracker.daylog;

import com.habittracker.challenge.Challenge;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DayLogRepository extends JpaRepository<DayLog, UUID> {

    List<DayLog> findByChallengeOrderByDateAsc(Challenge challenge);

    Optional<DayLog> findByChallengeAndDate(Challenge challenge, LocalDate date);
}
