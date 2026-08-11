package com.habittracker.daylog;

import com.habittracker.challenge.Challenge;
import com.habittracker.common.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

/**
 * One record per challenge per day. The day is not pass/fail — it holds how much of the
 * task list got done, so partial days still count towards the end-of-challenge report.
 */
@Getter
@Setter
@Entity
@Table(
        name = "day_logs",
        uniqueConstraints = @UniqueConstraint(columnNames = {"challenge_id", "date"}))
public class DayLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @Column(nullable = false)
    private LocalDate date;

    /** 0-100, rounded. Snapshotted so later task edits don't rewrite history. */
    @Column(nullable = false)
    private int completionPercent;

    @Column(nullable = false)
    private int completedCount;

    @Column(nullable = false)
    private int taskCount;

    private String note;

    @OneToMany(mappedBy = "dayLog", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DayTaskLog> taskLogs = new ArrayList<>();

    public void addTaskLog(DayTaskLog taskLog) {
        taskLog.setDayLog(this);
        taskLogs.add(taskLog);
    }
}
