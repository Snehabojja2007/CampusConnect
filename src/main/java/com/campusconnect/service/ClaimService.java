package com.campusconnect.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.campusconnect.dto.ClaimRequest;
import com.campusconnect.dto.ClaimResponse;
import com.campusconnect.entity.Claim;
import com.campusconnect.entity.ClaimStatus;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.ItemStatus;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.entity.NotificationType;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ConflictException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClaimRepository;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClaimService {

    private final ClaimRepository claimRepository;
    private final FoundItemRepository foundItemRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ClaimService(
                ClaimRepository claimRepository,
                FoundItemRepository foundItemRepository,
                UserRepository userRepository,
                NotificationService notificationService) {

        this.claimRepository = claimRepository;
        this.foundItemRepository = foundItemRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        }

    public ClaimResponse createClaim(
            ClaimRequest request,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        FoundItem foundItem = foundItemRepository
                .findById(request.getFoundItemId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Found item not found"));

        if (foundItem.getModerationStatus() != ModerationStatus.APPROVED) {
                throw new ForbiddenException(
                        "Only approved found items can be claimed");
        }

        if (foundItem.getStatus() == ItemStatus.CLAIMED) {
                throw new ConflictException(
                        "This item has already been claimed");
        }

        if (claimRepository.existsByUserIdAndFoundItemId(
                user.getId(),
                foundItem.getId())) {

            throw new ConflictException(
                    "You have already claimed this item");
        }

        Claim claim = Claim.builder()
                .foundItem(foundItem)
                .user(user)
                .status(ClaimStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Claim savedClaim = claimRepository.save(claim);

        List<User> securityUsers =
                userRepository.findByRole(Role.SECURITY);

        for (User securityUser : securityUsers) {

        notificationService.createNotification(
                securityUser.getEmail(),
                NotificationType.CLAIM_SUBMITTED,
                "New claim submitted for item: "
                        + foundItem.getTitle()
        );
        }

        return new ClaimResponse(
                savedClaim.getId(),
                foundItem.getId(),
                foundItem.getTitle(),
                user.getId(),
                user.getName(),
                savedClaim.getStatus(),
                savedClaim.getCreatedAt()
        );
    }

    public List<ClaimResponse> getMyClaims(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        List<Claim> claims =
                claimRepository.findByUserId(user.getId());

        return claims.stream()
                .map(claim -> new ClaimResponse(
                        claim.getId(),
                        claim.getFoundItem().getId(),
                        claim.getFoundItem().getTitle(),
                        claim.getUser().getId(),
                        claim.getUser().getName(),
                        claim.getStatus(),
                        claim.getCreatedAt()
                ))
                .toList();
    }

    @Transactional
    public ClaimResponse updateClaimStatus(
                Long claimId,
                ClaimStatus newStatus) {

        if (newStatus != ClaimStatus.APPROVED
                && newStatus != ClaimStatus.REJECTED) {
        throw new IllegalArgumentException(
                "Claim status must be APPROVED or REJECTED");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Claim not found"));


        if (claim.getStatus() != ClaimStatus.PENDING) {
                throw new ConflictException("Only pending claims can be updated");
        }

        claim.setStatus(newStatus);

        if (newStatus == ClaimStatus.APPROVED) {

                FoundItem foundItem = foundItemRepository
                        .findByIdForUpdate(claim.getFoundItem().getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException("Found item not found"));

                if (foundItem.getStatus() == ItemStatus.CLAIMED) {
                        throw new ConflictException(
                                "This item has already been claimed");
                }

                foundItem.setStatus(ItemStatus.CLAIMED);

                foundItemRepository.save(foundItem);
        }

        Claim savedClaim = claimRepository.save(claim);

        // Notify the student about the claim status
        if (newStatus == ClaimStatus.APPROVED) {

                notificationService.createNotification(
                        claim.getUser().getEmail(),
                        NotificationType.CLAIM_APPROVED,
                        "Your claim for item: "
                                + claim.getFoundItem().getTitle()
                                + " has been approved."
                );

        } else if (newStatus == ClaimStatus.REJECTED) {

                notificationService.createNotification(
                        claim.getUser().getEmail(),
                        NotificationType.CLAIM_REJECTED,
                        "Your claim for item: "
                                + claim.getFoundItem().getTitle()
                                + " has been rejected."
                );
        }

        return new ClaimResponse(
                savedClaim.getId(),
                savedClaim.getFoundItem().getId(),
                savedClaim.getFoundItem().getTitle(),
                savedClaim.getUser().getId(),
                savedClaim.getUser().getName(),
                savedClaim.getStatus(),
                savedClaim.getCreatedAt()
        );
        }
}