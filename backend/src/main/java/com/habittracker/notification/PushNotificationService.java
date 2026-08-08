package com.habittracker.notification;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

/**
 * Sends push notifications through the Expo Push API. Expo relays to FCM/APNs, so no
 * direct Firebase/Apple integration is needed for the mobile app.
 */
@Service
public class PushNotificationService {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);
    private static final String EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

    private final RestClient restClient = RestClient.create();

    public void send(String expoPushToken, String title, String body) {
        try {
            restClient
                    .post()
                    .uri(EXPO_PUSH_URL)
                    .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                    .body(Map.of("to", expoPushToken, "title", title, "body", body))
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("Failed to send push notification to {}: {}", expoPushToken, e.getMessage());
        }
    }

    public void sendToAll(List<String> expoPushTokens, String title, String body) {
        expoPushTokens.forEach(token -> send(token, title, body));
    }
}
