package com.campusconnect.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.dto.LostItemRequest;
import com.campusconnect.entity.ItemStatus;
import com.campusconnect.entity.LostItem;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.LostItemRepository;
import com.campusconnect.repository.UserRepository;

@Service
public class LostItemService {

    private final LostItemRepository lostItemRepository;
    private final UserRepository userRepository;

    public LostItemService(
            LostItemRepository lostItemRepository,
            UserRepository userRepository) {

        this.lostItemRepository = lostItemRepository;
        this.userRepository = userRepository;
    }

    public LostItem createLostItem(
            LostItemRequest request,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        LostItem lostItem = LostItem.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .lostDate(request.getLostDate())
                .status(ItemStatus.LOST)
                .moderationStatus(ModerationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .user(user)
                .build();

        return lostItemRepository.save(lostItem);
    }

    public Page<LostItem> getAllLostItems(Pageable pageable) {
        return lostItemRepository.findByModerationStatus(
                ModerationStatus.APPROVED, pageable);
    }

    public Page<LostItem> searchByLocation(
                String location, Pageable pageable) {
        return lostItemRepository
                .findByModerationStatusAndLocationContainingIgnoreCase(
                        ModerationStatus.APPROVED, location, pageable);
    }

    public Page<LostItem> searchByTitle(
                String title, Pageable pageable) {
        return lostItemRepository
                .findByModerationStatusAndTitleContainingIgnoreCase(
                        ModerationStatus.APPROVED, title, pageable);
    }

    public Page<LostItem> searchByLocationAndTitle(
                String location, String title, Pageable pageable) {
        return lostItemRepository
                .findByModerationStatusAndLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(
                        ModerationStatus.APPROVED, location, title, pageable);
    }

    public void deleteLostItem(Long id, String email) {

        LostItem lostItem = lostItemRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Lost item not found"));

        if (!lostItem.getUser().getEmail().equals(email)) {
            throw new ForbiddenException(
                    "You are not allowed to delete this item");
        }

        lostItemRepository.delete(lostItem);
    }

    public LostItem updateLostItem(
            Long id,
            LostItemRequest request,
            String email) {

        LostItem lostItem = lostItemRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Lost item not found"));

        if (!lostItem.getUser().getEmail().equals(email)) {
            throw new ForbiddenException(
                    "You are not allowed to update this item");
        }

        lostItem.setTitle(request.getTitle());
        lostItem.setDescription(request.getDescription());
        lostItem.setLocation(request.getLocation());
        lostItem.setLostDate(request.getLostDate());

        return lostItemRepository.save(lostItem);
    }
}