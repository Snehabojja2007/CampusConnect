package com.campusconnect.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.campusconnect.entity.Claim;
import com.campusconnect.entity.ClaimStatus;
import com.campusconnect.entity.Handover;
import com.campusconnect.entity.HandoverStatus;
import com.campusconnect.entity.NotificationType;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ConflictException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClaimRepository;
import com.campusconnect.repository.HandoverRepository;
import com.campusconnect.repository.UserRepository;

@Service
public class HandoverService {

    private final HandoverRepository handoverRepository;
    private final ClaimRepository claimRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public HandoverService(
                HandoverRepository handoverRepository,
                ClaimRepository claimRepository,
                UserRepository userRepository,
                NotificationService notificationService) {

        this.handoverRepository = handoverRepository;
        this.claimRepository = claimRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        }

    public Handover createHandover(
            Long claimId,
            String securityEmail) {

        User securityUser = userRepository.findByEmail(securityEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        if (securityUser.getRole() != Role.SECURITY &&
                securityUser.getRole() != Role.ADMIN) {

            throw new RuntimeException(
                    "Only Security or Admin can create a handover");
        }

        Claim claim = claimRepository.findById(claimId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Claim not found"));

        if (claim.getStatus() != ClaimStatus.APPROVED) {
            throw new ConflictException(
                    "Handover can only be created for an approved claim");
        }

        if (handoverRepository.findByClaimId(claimId).isPresent()) {
            throw new ConflictException(
                    "A handover already exists for this claim");
        }

        Handover handover = Handover.builder()
                .claim(claim)
                .student(claim.getUser())
                .securityUser(securityUser)
                .status(HandoverStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        Handover savedHandover = handoverRepository.save(handover);

        notificationService.createNotification(
                claim.getUser().getEmail(),
                NotificationType.HANDOVER_CREATED,
                "A handover has been created for your claimed item: "
                        + claim.getFoundItem().getTitle()
        );

        return savedHandover;
}
    public Handover completeHandover(
            Long handoverId,
            String securityEmail) {

        User securityUser = userRepository.findByEmail(securityEmail)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        if (securityUser.getRole() != Role.SECURITY &&
                securityUser.getRole() != Role.ADMIN) {

            throw new RuntimeException(
                    "Only Security or Admin can complete a handover");
        }

        Handover handover = handoverRepository.findById(handoverId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Handover not found"));

        if (handover.getStatus() != HandoverStatus.PENDING) {
            throw new ConflictException(
                    "Only pending handovers can be completed");
        }

        handover.setStatus(HandoverStatus.COMPLETED);
        handover.setCompletedAt(LocalDateTime.now());

        Handover savedHandover = handoverRepository.save(handover);

        notificationService.createNotification(
                handover.getStudent().getEmail(),
                NotificationType.HANDOVER_COMPLETED,
                "Your handover for item: "
                        + handover.getClaim().getFoundItem().getTitle()
                        + " has been completed."
        );

        return savedHandover;
    }
    public List<Handover> getMyHandovers(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == Role.STUDENT) {
            return handoverRepository
                    .findByStudentIdOrderByCreatedAtDesc(user.getId());
        }

        if (user.getRole() == Role.SECURITY || user.getRole() == Role.ADMIN) {
            return handoverRepository
                    .findBySecurityUserIdOrderByCreatedAtDesc(user.getId());
        }

        throw new RuntimeException("You are not allowed to view handovers");
    }
}