package com.habittracker.challenge;

import com.habittracker.user.User;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeRepository extends JpaRepository<Challenge, UUID> {

    List<Challenge> findByUserOrderByStartDateDesc(User user);

    List<Challenge> findByUserAndStatusOrderByStartDateDesc(User user, ChallengeStatus status);

    Optional<Challenge> findByIdAndUser(UUID id, User user);
}
