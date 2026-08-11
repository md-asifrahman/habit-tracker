package com.habittracker.challenge;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChallengeTaskRepository extends JpaRepository<ChallengeTask, UUID> {

    List<ChallengeTask> findByChallengeOrderBySortOrderAsc(Challenge challenge);
}
