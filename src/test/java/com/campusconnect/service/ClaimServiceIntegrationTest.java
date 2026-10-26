
package com.campusconnect.service;

import com.campusconnect.entity.Claim;
import com.campusconnect.entity.ClaimStatus;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.ItemStatus;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.entity.Notification;
import com.campusconnect.entity.NotificationType;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.repository.ClaimRepository;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.NotificationRepository;
import com.campusconnect.repository.UserRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
@ActiveProfiles("test")
class ClaimServiceIntegrationTest {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EntityManager entityManager;

    @Test
    void approvingClaimUpdatesDatabaseRecordsAndCreatesNotification() {

        // Arrange: create and save a student
        User student = User.builder()
                .name("Test Student")
                .email("integration-student@example.com")
                .password("test-password")
                .role(Role.STUDENT)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        student = userRepository.saveAndFlush(student);

        // Arrange: create and save an approved found item
        FoundItem item = FoundItem.builder()
                .title("Test Water Bottle")
                .description("Blue water bottle")
                .location("CSE Block")
                .foundDate(LocalDate.now())
                .status(ItemStatus.FOUND)
                .moderationStatus(ModerationStatus.APPROVED)
                .createdAt(LocalDateTime.now())
                .user(student)
                .build();

        item = foundItemRepository.saveAndFlush(item);

        // Arrange: create a pending claim
        Claim claim = Claim.builder()
                .foundItem(item)
                .user(student)
                .status(ClaimStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        claim = claimRepository.saveAndFlush(claim);

        Long claimId = claim.getId();
        Long itemId = item.getId();
        Long studentId = student.getId();

        // Act: approve the claim
        claimService.updateClaimStatus(claimId, ClaimStatus.APPROVED);

        // Assert: verify persisted claim status
        Claim savedClaim = claimRepository.findById(claimId)
                .orElseThrow();

        assertEquals(ClaimStatus.APPROVED, savedClaim.getStatus());

        // Assert: verify persisted found item status
        FoundItem savedItem = foundItemRepository.findById(itemId)
                .orElseThrow();

        assertEquals(ItemStatus.CLAIMED, savedItem.getStatus());

        // Assert: verify approval notification
        Notification notification = notificationRepository
                .findAll()
                .stream()
                .filter(n -> n.getUser().getId().equals(studentId))
                .filter(n -> n.getType() == NotificationType.CLAIM_APPROVED)
                .findFirst()
                .orElseThrow();

        assertNotNull(notification.getMessage());
    }

        
    @Test
    void approvingClaimWhenItemIsAlreadyClaimedDoesNotApproveClaim() {

        // Create a student
        User student = User.builder()
                .name("Rollback Test Student")
                .email("rollback-student@example.com")
                .password("test-password")
                .role(Role.STUDENT)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        student = userRepository.saveAndFlush(student);

        // Create an item that is already claimed
        FoundItem item = FoundItem.builder()
                .title("Already Claimed Phone")
                .description("Black phone")
                .location("Library")
                .foundDate(LocalDate.now())
                .status(ItemStatus.CLAIMED)
                .moderationStatus(ModerationStatus.APPROVED)
                .createdAt(LocalDateTime.now())
                .user(student)
                .build();

        item = foundItemRepository.saveAndFlush(item);

        // Create a pending claim for that item
        Claim claim = Claim.builder()
                .foundItem(item)
                .user(student)
                .status(ClaimStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        claim = claimRepository.saveAndFlush(claim);

        Long claimId = claim.getId();
        Long itemId = item.getId();

        // Approval should fail because the item is already claimed
        org.junit.jupiter.api.Assertions.assertThrows(
                com.campusconnect.exception.ConflictException.class,
                () -> claimService.updateClaimStatus(
                        claimId, ClaimStatus.APPROVED)
        );

        // Clear the persistence context by reloading records
        // Clear cached entities so the records are fetched again
        entityManager.clear();

        Claim savedClaim = claimRepository.findById(claimId)
                .orElseThrow();

        FoundItem savedItem = foundItemRepository.findById(itemId)
                .orElseThrow();

        // Verify neither record has an incorrect status
        assertEquals(ClaimStatus.PENDING, savedClaim.getStatus());
        assertEquals(ItemStatus.CLAIMED, savedItem.getStatus());
    }

}