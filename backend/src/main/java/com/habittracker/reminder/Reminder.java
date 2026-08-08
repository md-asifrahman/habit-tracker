package com.habittracker.reminder;

import com.habittracker.common.BaseEntity;
import com.habittracker.habit.Habit;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalTime;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "reminders")
public class Reminder extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id", nullable = false)
    private Habit habit;

    @Column(nullable = false)
    private LocalTime time;

    /** Comma-separated ISO day-of-week numbers (1=Mon..7=Sun), e.g. "1,2,3,4,5". */
    @Column(nullable = false)
    private String daysOfWeek;

    @Column(nullable = false)
    private boolean enabled = true;

    private Instant lastSentAt;
}
