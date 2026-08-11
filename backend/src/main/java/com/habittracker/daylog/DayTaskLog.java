package com.habittracker.daylog;

import com.habittracker.challenge.ChallengeTask;
import com.habittracker.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Whether one task of the list was ticked on one day. */
@Getter
@Setter
@Entity
@Table(name = "day_task_logs")
public class DayTaskLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_log_id", nullable = false)
    private DayLog dayLog;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private ChallengeTask task;

    @Column(nullable = false)
    private boolean done;
}
