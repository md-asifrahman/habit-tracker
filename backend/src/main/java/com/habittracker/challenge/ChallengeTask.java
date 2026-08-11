package com.habittracker.challenge;

import com.habittracker.common.BaseEntity;
import com.habittracker.daylog.DayTaskLog;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/** One of the things the user wants to do every day of a challenge. */
@Getter
@Setter
@Entity
@Table(name = "challenge_tasks")
public class ChallengeTask extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private int sortOrder;

    /**
     * Dropping a task from the list also drops its ticks on days already logged — those rows
     * reference the task, so they have to go with it.
     */
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DayTaskLog> taskLogs = new ArrayList<>();
}
