package com.habittracker.common;

import com.habittracker.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.ZoneId;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Resolves which timezone "today" means for the current request.
 *
 * A challenge is measured in days, so the boundary between one day and the next has to be the
 * user's midnight, not the server's. Otherwise a user in UTC+6 logging at 1am would be told the
 * day is still yesterday, and the report's day count would disagree with what their phone shows.
 *
 * Preference order: the {@code X-Time-Zone} header the clients send, then the zone stored on the
 * account at sign-in, then UTC.
 */
@Component
@RequiredArgsConstructor
public class RequestZone {

    public static final String HEADER = "X-Time-Zone";

    private final HttpServletRequest request;

    public ZoneId get() {
        ZoneId fromHeader = parse(request.getHeader(HEADER));
        if (fromHeader != null) {
            return fromHeader;
        }
        ZoneId fromAccount = parse(currentUserTimezone());
        return fromAccount != null ? fromAccount : ZoneId.of("UTC");
    }

    /** The current date as the user experiences it. */
    public LocalDate today() {
        return LocalDate.now(get());
    }

    private String currentUserTimezone() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UserPrincipal principal)) {
            return null;
        }
        return principal.getUser().getTimezone();
    }

    /** Never throws — an unknown or malformed zone just falls through to the next option. */
    private static ZoneId parse(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return ZoneId.of(value.trim());
        } catch (Exception ignored) {
            return null;
        }
    }
}
