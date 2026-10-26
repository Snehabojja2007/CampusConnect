package com.campusconnect.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.ModerationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface FoundItemRepository extends JpaRepository<FoundItem, Long> {

    Page<FoundItem> findByLocationContainingIgnoreCase(
            String location,
            Pageable pageable
    );

    Page<FoundItem> findByTitleContainingIgnoreCase(
            String title,
            Pageable pageable
    );

    Page<FoundItem> findByLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(
            String location,
            String title,
            Pageable pageable
    );
    List<FoundItem> findAllByOrderByCreatedAtDesc();

    List<FoundItem> findByModerationStatusOrderByCreatedAtDesc(
        ModerationStatus moderationStatus);
    
Page<FoundItem> findByModerationStatus(
        ModerationStatus moderationStatus,
        Pageable pageable);

Page<FoundItem> findByModerationStatusAndLocationContainingIgnoreCase(
        ModerationStatus moderationStatus,
        String location,
        Pageable pageable);

Page<FoundItem> findByModerationStatusAndTitleContainingIgnoreCase(
        ModerationStatus moderationStatus,
        String title,
        Pageable pageable);

Page<FoundItem> findByModerationStatusAndLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(
        ModerationStatus moderationStatus,
        String location,
        String title,
        Pageable pageable);

        @Lock(LockModeType.PESSIMISTIC_WRITE)
        @Query("SELECT f FROM FoundItem f WHERE f.id = :id")
        Optional<FoundItem> findByIdForUpdate(@Param("id") Long id);

}