package com.habittracker.mindmap;

import com.habittracker.user.User;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MindMapRepository extends JpaRepository<MindMap, UUID> {

    List<MindMap> findByUser(User user);
}
