package com.habittracker.challenge;

import com.habittracker.challenge.dto.ChallengeRequest;
import com.habittracker.challenge.dto.ChallengeResponse;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/habits/{habitId}/challenges")
@RequiredArgsConstructor
public class ChallengeController {

    private final ChallengeService challengeService;

    @GetMapping("/active")
    public ChallengeResponse getActive(@PathVariable UUID habitId) {
        return challengeService.getActive(habitId);
    }

    @PostMapping
    public ResponseEntity<ChallengeResponse> start(
            @PathVariable UUID habitId, @Valid @RequestBody ChallengeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(challengeService.start(habitId, request));
    }
}
