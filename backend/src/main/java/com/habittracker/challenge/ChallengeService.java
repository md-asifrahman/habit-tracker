package com.habittracker.challenge;

import com.habittracker.challenge.dto.ChallengeRequest;
import com.habittracker.challenge.dto.ChallengeResponse;
import com.habittracker.challenge.dto.ChallengeUpsertRequest;
import com.habittracker.challenge.dto.TaskUpsertRequest;
import com.habittracker.common.RequestZone;
import com.habittracker.common.exception.ApiException;
import com.habittracker.security.CurrentUser;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final CurrentUser currentUser;
    private final RequestZone requestZone;

    @Transactional
    public List<ChallengeResponse> list(ChallengeStatus status) {
        List<Challenge> challenges = status == null
                ? challengeRepository.findByUserOrderByStartDateDesc(currentUser.get())
                : challengeRepository.findByUserAndStatusOrderByStartDateDesc(currentUser.get(), status);
        LocalDate today = requestZone.today();
        return challenges.stream()
                .map(this::refreshStatus)
                .map(challenge -> ChallengeResponse.from(challenge, today))
                .toList();
    }

    @Transactional
    public ChallengeResponse get(UUID id) {
        return ChallengeResponse.from(refreshStatus(findOwned(id)), requestZone.today());
    }

    @Transactional
    public ChallengeResponse create(ChallengeRequest request) {
        LocalDate start = request.startDate() != null ? request.startDate() : requestZone.today();

        Challenge challenge = new Challenge();
        challenge.setUser(currentUser.get());
        challenge.setTitle(request.title().trim());
        challenge.setDurationDays(request.durationDays());
        challenge.setStartDate(start);
        challenge.setEndDate(start.plusDays(request.durationDays() - 1L));
        challenge.setStatus(ChallengeStatus.ACTIVE);
        challenge.setReminderTime(request.reminderTime());
        challenge.setReminderSound(request.reminderSound());
        challenge.setRepeatEnabled(request.repeatEnabled());
        challenge.setRepeatEveryMin(request.repeatEveryMin());
        challenge.setRestDays(RestDays.serialize(request.restDays()));

        int order = 0;
        for (String title : request.tasks()) {
            ChallengeTask task = new ChallengeTask();
            task.setTitle(title.trim());
            task.setSortOrder(order++);
            challenge.addTask(task);
        }

        return ChallengeResponse.from(challengeRepository.save(challenge), requestZone.today());
    }

    /**
     * Creates or replaces a challenge under a caller-chosen id. This is what the mobile client
     * pushes when it syncs: the record already exists on the device, so the id comes with it.
     */
    @Transactional
    public ChallengeResponse upsert(UUID id, ChallengeUpsertRequest request) {
        Challenge challenge = challengeRepository.findByIdAndUser(id, currentUser.get()).orElse(null);
        if (challenge == null) {
            if (challengeRepository.existsById(id)) {
                throw ApiException.conflict("That challenge id belongs to someone else");
            }
            challenge = new Challenge();
            challenge.setId(id);
            challenge.setUser(currentUser.get());
        }

        challenge.setTitle(request.title().trim());
        challenge.setDurationDays(request.durationDays());
        challenge.setStartDate(request.startDate());
        challenge.setEndDate(request.startDate().plusDays(request.durationDays() - 1L));
        challenge.setStatus(request.status());
        challenge.setReminderTime(request.reminderTime());
        challenge.setReminderSound(request.reminderSound());
        challenge.setRepeatEnabled(request.repeatEnabled());
        challenge.setRepeatEveryMin(request.repeatEveryMin());
        challenge.setRestDays(RestDays.serialize(request.restDays()));
        applyTasks(challenge, request.tasks());

        return ChallengeResponse.from(challengeRepository.save(challenge), requestZone.today());
    }

    /**
     * Replaces the task list. Tasks sent with an existing id keep that id — and therefore keep
     * their history in past day logs. Existing tasks left out are removed along with their logs.
     */
    private void applyTasks(Challenge challenge, List<TaskUpsertRequest> requested) {
        if (requested.isEmpty()) {
            throw ApiException.badRequest("A challenge needs at least one task");
        }

        List<UUID> keptIds =
                requested.stream().map(TaskUpsertRequest::id).filter(java.util.Objects::nonNull).toList();
        challenge.getTasks().removeIf(task -> !keptIds.contains(task.getId()));

        List<ChallengeTask> existing = new ArrayList<>(challenge.getTasks());
        int order = 0;
        for (TaskUpsertRequest req : requested) {
            ChallengeTask task = existing.stream()
                    .filter(candidate -> candidate.getId().equals(req.id()))
                    .findFirst()
                    .orElse(null);
            if (task == null) {
                task = new ChallengeTask();
                // A client that created the task offline sends the id it already used locally.
                if (req.id() != null) {
                    task.setId(req.id());
                }
                challenge.addTask(task);
            }
            task.setTitle(req.title().trim());
            task.setSortOrder(order++);
        }
        challenge.getTasks().sort(java.util.Comparator.comparingInt(ChallengeTask::getSortOrder));
    }

    @Transactional
    public ChallengeResponse abandon(UUID id) {
        Challenge challenge = findOwned(id);
        challenge.setStatus(ChallengeStatus.ABANDONED);
        return ChallengeResponse.from(challengeRepository.save(challenge), requestZone.today());
    }

    @Transactional
    public void delete(UUID id) {
        challengeRepository.delete(findOwned(id));
    }

    public Challenge findOwned(UUID id) {
        return challengeRepository
                .findByIdAndUser(id, currentUser.get())
                .orElseThrow(() -> ApiException.notFound("Challenge not found"));
    }

    /** Flips an active challenge to COMPLETED once its last day has passed. */
    public Challenge refreshStatus(Challenge challenge) {
        if (challenge.getStatus() == ChallengeStatus.ACTIVE
                && requestZone.today().isAfter(challenge.getEndDate())) {
            challenge.setStatus(ChallengeStatus.COMPLETED);
            return challengeRepository.save(challenge);
        }
        return challenge;
    }
}
