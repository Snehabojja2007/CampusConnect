package com.campusconnect.service;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import com.campusconnect.exception.ConflictException;
import com.campusconnect.dto.FoundItemRequest;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.ItemStatus;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.UserRepository;

@Service
public class FoundItemService {

    private final FoundItemRepository foundItemRepository;
    private final UserRepository userRepository;

    public FoundItemService(
            FoundItemRepository foundItemRepository,
            UserRepository userRepository) {

        this.foundItemRepository = foundItemRepository;
        this.userRepository = userRepository;
    }

    public FoundItem createFoundItem(
            FoundItemRequest request,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        FoundItem foundItem = FoundItem.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .location(request.getLocation())
                .foundDate(request.getFoundDate())
                .status(ItemStatus.FOUND)
                .createdAt(LocalDateTime.now())
                .user(user)
                .moderationStatus(ModerationStatus.PENDING)
                .build();

        return foundItemRepository.save(foundItem);
    }

    public Page<FoundItem> getAllFoundItems(Pageable pageable) {

        return foundItemRepository.findByModerationStatus(
        ModerationStatus.APPROVED, pageable);
    }

    public Page<FoundItem> searchByLocation(
            String location,
            Pageable pageable) {

        return foundItemRepository
        .findByModerationStatusAndLocationContainingIgnoreCase(
                ModerationStatus.APPROVED, location, pageable);
    }

    public Page<FoundItem> searchByTitle(
            String title,
            Pageable pageable) {

        return foundItemRepository
        .findByModerationStatusAndTitleContainingIgnoreCase(
                ModerationStatus.APPROVED, title, pageable);
    }

    public Page<FoundItem> searchByLocationAndTitle(
            String location,
            String title,
            Pageable pageable) {

        return foundItemRepository
        .findByModerationStatusAndLocationContainingIgnoreCaseAndTitleContainingIgnoreCase(
                ModerationStatus.APPROVED, location, title, pageable);
    }

    public FoundItem updateFoundItem(
            Long id,
            FoundItemRequest request,
            String email) {

        FoundItem foundItem = foundItemRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Found item not found"));

        if (!foundItem.getUser().getEmail().equals(email)) {
            throw new ForbiddenException(
                    "You are not allowed to update this item");
        }

        if (foundItem.getStatus() == ItemStatus.CLAIMED) {
             throw new ConflictException(
                     "A claimed item cannot be updated");
        }

        foundItem.setTitle(request.getTitle());
        foundItem.setDescription(request.getDescription());
        foundItem.setLocation(request.getLocation());
        foundItem.setFoundDate(request.getFoundDate());

        return foundItemRepository.save(foundItem);
    }

    public void deleteFoundItem(Long id, String email) {

        FoundItem foundItem = foundItemRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Found item not found"));

        if (!foundItem.getUser().getEmail().equals(email)) {
            throw new ForbiddenException(
                    "You are not allowed to delete this item");
        }

        if (foundItem.getStatus() == ItemStatus.CLAIMED) {
            throw new ConflictException(
                    "A claimed item cannot be deleted");
        }
        foundItemRepository.delete(foundItem);
    }
}