package com.habittracker.challenge;

import com.habittracker.challenge.dto.ChallengeRequest;
import com.habittracker.challenge.dto.ChallengeResponse;
import com.habittracker.challenge.dto.ChallengeUpsertRequest;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @GetMapping
    public List<ChallengeResponse> list(@RequestParam(required = false) ChallengeStatus status) {
        return challengeService.list(status);
    }

    @GetMapping("/{id}")
    public ChallengeResponse get(@PathVariable UUID id) {
        return challengeService.get(id);
    }

    /** Create with a server-assigned id — used by the web app. */
    @PostMapping
    public ResponseEntity<ChallengeResponse> create(@Valid @RequestBody ChallengeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(challengeService.create(request));
    }

    /**
     * Create-or-replace under a caller-chosen id. Used by the web edit screen and by the mobile
     * client when it syncs a challenge it created offline.
     */
    @PutMapping("/{id}")
    public ChallengeResponse upsert(@PathVariable UUID id, @Valid @RequestBody ChallengeUpsertRequest request) {
        return challengeService.upsert(id, request);
    }

    @PostMapping("/{id}/abandon")
    public ChallengeResponse abandon(@PathVariable UUID id) {
        return challengeService.abandon(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        challengeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
