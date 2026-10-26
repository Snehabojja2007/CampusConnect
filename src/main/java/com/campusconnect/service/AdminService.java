
package com.campusconnect.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.campusconnect.dto.UserStatusRequest;
import com.campusconnect.entity.Claim;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.Handover;
import com.campusconnect.entity.LostItem;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClaimRepository;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.HandoverRepository;
import com.campusconnect.repository.LostItemRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.dto.ModerationRequest;
import com.campusconnect.exception.ConflictException;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ClaimRepository claimRepository;
    private final HandoverRepository handoverRepository;
    private final LostItemRepository lostItemRepository;
    private final FoundItemRepository foundItemRepository;

    public AdminService(
            UserRepository userRepository,
            ClaimRepository claimRepository,
            HandoverRepository handoverRepository,
            LostItemRepository lostItemRepository,
            FoundItemRepository foundItemRepository) {

        this.userRepository = userRepository;
        this.claimRepository = claimRepository;
        this.handoverRepository = handoverRepository;
        this.lostItemRepository = lostItemRepository;
        this.foundItemRepository = foundItemRepository;
    }

    public List<User> getAllUsers() {
        return userRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Claim> getAllClaims() {
        return claimRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Handover> getAllHandovers() {
        return handoverRepository.findAllByOrderByCreatedAtDesc();
    }

    public User updateUserStatus(Long userId, UserStatusRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        user.setActive(request.getActive());
        return userRepository.save(user);
    }

    public List<LostItem> getAllLostItems() {
        return lostItemRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<FoundItem> getAllFoundItems() {
        return foundItemRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<LostItem> getPendingLostItems() {
        return lostItemRepository.findByModerationStatusOrderByCreatedAtDesc(
                ModerationStatus.PENDING);
    }

    public List<FoundItem> getPendingFoundItems() {
        return foundItemRepository.findByModerationStatusOrderByCreatedAtDesc(
                ModerationStatus.PENDING);
    }
    public LostItem moderateLostItem(Long itemId, ModerationRequest request) {

        LostItem item = lostItemRepository.findById(itemId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Lost item not found"));

        if (item.getModerationStatus() != ModerationStatus.PENDING) {
            throw new ConflictException(
                    "Only pending lost items can be moderated");
        }

        ModerationStatus newStatus = request.getModerationStatus();

        if (newStatus != ModerationStatus.APPROVED
                && newStatus != ModerationStatus.REJECTED) {
            throw new IllegalArgumentException(
                    "Moderation status must be APPROVED or REJECTED");
        }

        item.setModerationStatus(newStatus);

        return lostItemRepository.save(item);
    }

        
    public FoundItem moderateFoundItem(Long itemId, ModerationRequest request) {

        FoundItem item = foundItemRepository.findById(itemId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Found item not found"));

        if (item.getModerationStatus() != ModerationStatus.PENDING) {
            throw new ConflictException(
                    "Only pending found items can be moderated");
        }

        ModerationStatus newStatus = request.getModerationStatus();

        if (newStatus != ModerationStatus.APPROVED
                && newStatus != ModerationStatus.REJECTED) {
            throw new IllegalArgumentException(
                    "Moderation status must be APPROVED or REJECTED");
        }

        item.setModerationStatus(newStatus);

        return foundItemRepository.save(item);
    }

}