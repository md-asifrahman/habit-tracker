package com.habittracker.mindmap;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MindMapNodeRepository extends JpaRepository<MindMapNode, UUID> {

    List<MindMapNode> findByMindMap(MindMap mindMap);
}
