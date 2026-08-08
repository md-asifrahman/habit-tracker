package com.habittracker.reminder;

import com.habittracker.device.DeviceTokenRepository;
import com.habittracker.notification.PushNotificationService;
import com.habittracker.user.User;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Polls enabled reminders every minute and fires a push notification for any reminder
 * whose scheduled time (in the owning user's timezone) matches the current minute.
 */
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final ReminderRepository reminderRepository;
    private final DeviceTokenRepository deviceTokenRepository;
    private final PushNotificationService pushNotificationService;

    @Scheduled(cron = "0 * * * * *")
    public void dispatchDueReminders() {
        List<Reminder> enabledReminders = reminderRepository.findByEnabledTrue();

        for (Reminder reminder : enabledReminders) {
            if (isDue(reminder)) {
                sendReminder(reminder);
            }
        }
    }

    private boolean isDue(Reminder reminder) {
        User user = reminder.getHabit().getUser();
        ZonedDateTime nowInUserTz = ZonedDateTime.now(ZoneId.of(user.getTimezone()));

        boolean matchesTime = nowInUserTz.getHour() == reminder.getTime().getHour()
                && nowInUserTz.getMinute() == reminder.getTime().getMinute();
        boolean matchesDay = parseDaysOfWeek(reminder.getDaysOfWeek()).contains(nowInUserTz.getDayOfWeek().getValue());
        boolean alreadySentThisMinute = reminder.getLastSentAt() != null
                && ZonedDateTime.ofInstant(reminder.getLastSentAt(), nowInUserTz.getZone())
                        .truncatedTo(java.time.temporal.ChronoUnit.MINUTES)
                        .equals(nowInUserTz.truncatedTo(java.time.temporal.ChronoUnit.MINUTES));

        return matchesTime && matchesDay && !alreadySentThisMinute;
    }

    private Set<Integer> parseDaysOfWeek(String daysOfWeek) {
        return Arrays.stream(daysOfWeek.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toSet());
    }

    private void sendReminder(Reminder reminder) {
        User user = reminder.getHabit().getUser();
        List<String> tokens = deviceTokenRepository.findByUser(user).stream()
                .map(dt -> dt.getPushToken())
                .toList();

        pushNotificationService.sendToAll(tokens, "Habit reminder", reminder.getHabit().getTitle());

        reminder.setLastSentAt(Instant.now());
        reminderRepository.save(reminder);
    }
}
