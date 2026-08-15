package com.habittracker.challenge;

import com.habittracker.common.BaseEntity;
import com.habittracker.daylog.DayLog;
import com.habittracker.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "challenges")
public class Challenge extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private int durationDays;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChallengeStatus status = ChallengeStatus.ACTIVE;

    /** Time of day the daily reminder fires. */
    @Column(nullable = false)
    private LocalTime reminderTime = LocalTime.of(22, 0);

    /** Either "default" (the phone's own notification sound) or "silent". */
    @Column(nullable = false)
    private String reminderSound = "default";

    /** Whether to keep nagging until the day is logged. */
    @Column(nullable = false)
    private boolean repeatEnabled = true;

    /** Minutes between repeat reminders. */
    @Column(nullable = false)
    private int repeatEveryMin = 30;

    /**
     * Days the challenge deliberately takes off, as comma-separated ISO day-of-week numbers
     * (1=Mon .. 7=Sun), e.g. "6,7" for weekends. Rest days get no reminder and are left out of
     * the report entirely — they are not misses, so they must not drag the average down or break
     * a streak.
     */
    @Column(nullable = false)
    private String restDays = "";

    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ChallengeTask> tasks = new ArrayList<>();

    /**
     * Owned so that deleting a challenge takes its day logs with it — the logs hold the FK, so
     * without the cascade the database would reject the delete.
     */
    @OneToMany(mappedBy = "challenge", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DayLog> dayLogs = new ArrayList<>();

    public void addTask(ChallengeTask task) {
        task.setChallenge(this);
        tasks.add(task);
    }
}
