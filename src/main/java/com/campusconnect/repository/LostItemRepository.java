package com.campusconnect.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.campusconnect.entity.LostItem;
import com.campusconnect.entity.ModerationStatus;


public interface LostItemRepository extends JpaRepository<LostItem, Long> {

    Page<LostItem> findByLocationContainingIgnoreCase(
            String location,
            Pageable pageable
    );

    Page<LostItem> findByTitleContainingIgnoreCase(
            String title,
            Pageable pageable
    );

    Page<LostItem> findByLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(
            String location,
            String title,
            Pageable pageable
    );

    List<LostItem> findAllByOrderByCreatedAtDesc();

    List<LostItem> findByModerationStatusOrderByCreatedAtDesc(
        ModerationStatus moderationStatus);

    Page<LostItem> findByModerationStatus(
        ModerationStatus moderationStatus,
        Pageable pageable);

    
Page<LostItem> findByModerationStatusAndLocationContainingIgnoreCase(
        ModerationStatus moderationStatus,
        String location,
        Pageable pageable);

Page<LostItem> findByModerationStatusAndTitleContainingIgnoreCase(
        ModerationStatus moderationStatus,
        String title,
        Pageable pageable);

Page<LostItem> findByModerationStatusAndLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(
        ModerationStatus moderationStatus,
        String location,
        String title,
        Pageable pageable);

}