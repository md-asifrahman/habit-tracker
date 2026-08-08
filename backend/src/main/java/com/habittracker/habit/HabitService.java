package com.habittracker.habit;

import com.habittracker.common.exception.ApiException;
import com.habittracker.habit.dto.HabitRequest;
import com.habittracker.habit.dto.HabitResponse;
import com.habittracker.security.CurrentUser;
import com.habittracker.user.User;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final CurrentUser currentUser;

    public List<HabitResponse> listHabits() {
        User user = currentUser.get();
        return habitRepository.findByUserAndArchivedFalse(user).stream()
                .map(HabitResponse::from)
                .toList();
    }

    public HabitResponse createHabit(HabitRequest request) {
        User user = currentUser.get();

        Habit habit = new Habit();
        habit.setUser(user);
        habit.setTitle(request.title());
        habit.setDescription(request.description());
        habit.setType(request.type());
        habit.setFrequency(request.frequency());
        habit.setIcon(request.icon() != null ? request.icon() : "leaf");
        habit.setColor(request.color() != null ? request.color() : "accent");

        return HabitResponse.from(habitRepository.save(habit));
    }

    public HabitResponse getHabit(UUID id) {
        return HabitResponse.from(findOwnedHabit(id));
    }

    public HabitResponse updateHabit(UUID id, HabitRequest request) {
        Habit habit = findOwnedHabit(id);
        habit.setTitle(request.title());
        habit.setDescription(request.description());
        habit.setType(request.type());
        habit.setFrequency(request.frequency());
        habit.setIcon(request.icon() != null ? request.icon() : habit.getIcon());
        habit.setColor(request.color() != null ? request.color() : habit.getColor());
        return HabitResponse.from(habitRepository.save(habit));
    }

    public void deleteHabit(UUID id) {
        Habit habit = findOwnedHabit(id);
        habit.setArchived(true);
        habitRepository.save(habit);
    }

    private Habit findOwnedHabit(UUID id) {
        return habitRepository
                .findByIdAndUser(id, currentUser.get())
                .orElseThrow(() -> ApiException.notFound("Habit not found"));
    }
}
