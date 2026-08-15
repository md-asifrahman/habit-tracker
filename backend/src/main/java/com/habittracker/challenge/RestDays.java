package com.habittracker.challenge;

import com.habittracker.common.exception.ApiException;
import java.time.LocalDate;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Rest days are stored on the challenge as a comma-separated list of ISO day-of-week numbers
 * (1=Mon .. 7=Sun). They are days the user deliberately takes off: no reminder fires, and the
 * report leaves them out of every calculation, so a planned day off is never counted as a miss.
 */
public final class RestDays {

    private RestDays() {}

    public static String serialize(Collection<Integer> days) {
        if (days == null || days.isEmpty()) {
            return "";
        }
        Set<Integer> unique = new LinkedHashSet<>(days);
        if (unique.stream().anyMatch(day -> day < 1 || day > 7)) {
            throw ApiException.badRequest("Rest days must be between 1 (Monday) and 7 (Sunday)");
        }
        if (unique.size() >= 7) {
            throw ApiException.badRequest("A challenge needs at least one active day");
        }
        return unique.stream().sorted().map(String::valueOf).collect(Collectors.joining(","));
    }

    public static List<Integer> parse(String stored) {
        if (stored == null || stored.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(stored.split(","))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .map(Integer::valueOf)
                .sorted()
                .toList();
    }

    /** True when this date falls on one of the challenge's days off. */
    public static boolean isRestDay(Challenge challenge, LocalDate date) {
        return parse(challenge.getRestDays()).contains(date.getDayOfWeek().getValue());
    }
}
