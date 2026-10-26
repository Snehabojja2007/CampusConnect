package com.campusconnect.service;

import com.campusconnect.dto.ClaimRequest;
import com.campusconnect.dto.ClaimResponse;
import com.campusconnect.entity.Claim;
import com.campusconnect.entity.ClaimStatus;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.ItemStatus;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.entity.NotificationType;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ConflictException;
import com.campusconnect.repository.ClaimRepository;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;


@ExtendWith(MockitoExtension.class)
class ClaimServiceTest {

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private FoundItemRepository foundItemRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ClaimService claimService;

    private User student;
    private FoundItem foundItem;

    @BeforeEach
    void setUp() {
        student = new User();
        student.setId(1L);
        student.setEmail("student@college.com");

        foundItem = new FoundItem();
        foundItem.setId(10L);
        foundItem.setTitle("Red Water Bottle");
        foundItem.setModerationStatus(ModerationStatus.APPROVED);
        foundItem.setStatus(ItemStatus.CLAIMED);
    }

    @Test
    void createClaim_WhenItemAlreadyClaimed_ThrowsConflictException() {
        // Arrange: prepare the student and already-claimed item
        ClaimRequest request = new ClaimRequest();
        request.setFoundItemId(10L);

        when(userRepository.findByEmail("student@college.com"))
                .thenReturn(Optional.of(student));

        when(foundItemRepository.findById(10L))
                .thenReturn(Optional.of(foundItem));

        // Act + Assert: claiming it again must fail with a conflict
        assertThrows(
                ConflictException.class,
                () -> claimService.createClaim(request, "student@college.com")
        );

        // Verify: no new claim should be saved
        verify(claimRepository, never()).save(any());
    }
    
    @Test
    void createClaim_WhenStudentAlreadyClaimedItem_ThrowsConflictException() {
        ClaimRequest request = new ClaimRequest();
        request.setFoundItemId(10L);

        // The student exists
        when(userRepository.findByEmail("student@college.com"))
                .thenReturn(Optional.of(student));

        // The item is approved and available
        foundItem.setStatus(ItemStatus.FOUND);

        when(foundItemRepository.findById(10L))
                .thenReturn(Optional.of(foundItem));

        // This student already has a claim for this item
        when(claimRepository.existsByUserIdAndFoundItemId(1L, 10L))
                .thenReturn(true);

        assertThrows(
                ConflictException.class,
                () -> claimService.createClaim(request, "student@college.com")
        );

        // No second claim should be saved
        verify(claimRepository, never()).save(any());
    }

    
    @Test
    void createClaim_WhenItemIsNotApproved_ThrowsForbiddenException() {
        ClaimRequest request = new ClaimRequest();
        request.setFoundItemId(10L);

        when(userRepository.findByEmail("student@college.com"))
                .thenReturn(Optional.of(student));

        foundItem.setStatus(ItemStatus.FOUND);
        foundItem.setModerationStatus(ModerationStatus.PENDING);

        when(foundItemRepository.findById(10L))
                .thenReturn(Optional.of(foundItem));

        assertThrows(
                com.campusconnect.exception.ForbiddenException.class,
                () -> claimService.createClaim(request, "student@college.com")
        );

        verify(claimRepository, never()).save(any());
    }

    
    @Test
    void createClaim_WhenRequestIsValid_SavesPendingClaimAndNotifiesSecurity() {
        ClaimRequest request = new ClaimRequest();
        request.setFoundItemId(10L);

        foundItem.setStatus(ItemStatus.FOUND);
        foundItem.setModerationStatus(ModerationStatus.APPROVED);

        User securityUser = new User();
        securityUser.setId(2L);
        securityUser.setEmail("security@college.com");

        when(userRepository.findByEmail("student@college.com"))
                .thenReturn(Optional.of(student));

        when(foundItemRepository.findById(10L))
                .thenReturn(Optional.of(foundItem));

        when(claimRepository.existsByUserIdAndFoundItemId(1L, 10L))
                .thenReturn(false);

        when(claimRepository.save(any(Claim.class)))
                .thenAnswer(invocation -> {
                    Claim claim = invocation.getArgument(0);
                    claim.setId(100L);
                    return claim;
                });

        when(userRepository.findByRole(Role.SECURITY))
                .thenReturn(java.util.List.of(securityUser));

        ClaimResponse response =
                claimService.createClaim(request, "student@college.com");

        org.junit.jupiter.api.Assertions.assertNotNull(response);
        org.junit.jupiter.api.Assertions.assertEquals(
                ClaimStatus.PENDING, response.getStatus());

        verify(claimRepository).save(any(Claim.class));

        verify(notificationService).createNotification(
                "security@college.com",
                NotificationType.CLAIM_SUBMITTED,
                "New claim submitted for item: Red Water Bottle"
        );
    }

    
@Test
void updateClaimStatus_WhenApproved_ClaimsItemAndNotifiesStudent() {
    foundItem.setStatus(ItemStatus.FOUND);
    foundItem.setModerationStatus(ModerationStatus.APPROVED);

    Claim claim = Claim.builder()
            .id(100L)
            .foundItem(foundItem)
            .user(student)
            .status(ClaimStatus.PENDING)
            .createdAt(java.time.LocalDateTime.now())
            .build();

    when(claimRepository.findById(100L))
            .thenReturn(Optional.of(claim));

    when(foundItemRepository.findByIdForUpdate(10L))
            .thenReturn(Optional.of(foundItem));

    when(claimRepository.save(any(Claim.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

    when(foundItemRepository.save(any(FoundItem.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

    ClaimResponse response =
            claimService.updateClaimStatus(100L, ClaimStatus.APPROVED);

    // The claim should be approved
    org.junit.jupiter.api.Assertions.assertEquals(
            ClaimStatus.APPROVED, response.getStatus());

    // The found item should be marked as claimed
    org.junit.jupiter.api.Assertions.assertEquals(
            ItemStatus.CLAIMED, foundItem.getStatus());

    // Verify both records are saved
    verify(foundItemRepository).save(foundItem);
    verify(claimRepository).save(claim);

    // Verify the student receives an approval notification
    verify(notificationService).createNotification(
            "student@college.com",
            NotificationType.CLAIM_APPROVED,
            "Your claim for item: Red Water Bottle has been approved."
    );
}


@Test
void updateClaimStatus_WhenClaimIsNotPending_ThrowsConflictException() {
    Claim claim = Claim.builder()
            .id(100L)
            .foundItem(foundItem)
            .user(student)
            .status(ClaimStatus.APPROVED)
            .createdAt(LocalDateTime.now())
            .build();

    when(claimRepository.findById(100L))
            .thenReturn(Optional.of(claim));

    assertThrows(
            ConflictException.class,
            () -> claimService.updateClaimStatus(
                    100L, ClaimStatus.APPROVED)
    );

    verify(foundItemRepository, never()).findByIdForUpdate(any());
    verify(claimRepository, never()).save(any());
}


@Test
void updateClaimStatus_WhenItemAlreadyClaimed_ThrowsConflictException() {
    // Arrange: the claim is pending, but the item is already claimed
    FoundItem foundItem = new FoundItem();
    foundItem.setId(10L);
    foundItem.setStatus(ItemStatus.CLAIMED);
    foundItem.setModerationStatus(ModerationStatus.APPROVED);

    User student = new User();
    student.setId(2L);
    student.setRole(Role.STUDENT);

    Claim claim = new Claim();
    claim.setId(100L);
    claim.setFoundItem(foundItem);
    claim.setUser(student);
    claim.setStatus(ClaimStatus.PENDING);
    claim.setCreatedAt(LocalDateTime.now());

    when(claimRepository.findById(100L))
            .thenReturn(Optional.of(claim));

    when(foundItemRepository.findByIdForUpdate(10L))
            .thenReturn(Optional.of(foundItem));

    // Act + Assert: approving the claim must fail
    assertThrows(
            ConflictException.class,
            () -> claimService.updateClaimStatus(
                    100L, ClaimStatus.APPROVED)
    );

    // Verify the locked item was checked
    verify(foundItemRepository).findByIdForUpdate(10L);

    // Verify nothing was saved after the conflict
    verify(foundItemRepository, never()).save(any(FoundItem.class));
    verify(claimRepository, never()).save(any(Claim.class));
}


@Test
void getMyClaims_ReturnsOnlyClaimsBelongingToRequestedUser() {
    User student = new User();
    student.setId(2L);
    student.setName("Sneha");
    student.setEmail("sneha@example.com");
    student.setRole(Role.STUDENT);

    FoundItem foundItem = new FoundItem();
    foundItem.setId(10L);
    foundItem.setTitle("Red Water Bottle");

    Claim claim = new Claim();
    claim.setId(100L);
    claim.setUser(student);
    claim.setFoundItem(foundItem);
    claim.setStatus(ClaimStatus.PENDING);
    claim.setCreatedAt(LocalDateTime.now());

    when(userRepository.findByEmail("sneha@example.com"))
            .thenReturn(Optional.of(student));

    when(claimRepository.findByUserId(2L))
            .thenReturn(List.of(claim));

    List<ClaimResponse> result =
            claimService.getMyClaims("sneha@example.com");

    assertEquals(1, result.size());
    assertEquals(100L, result.get(0).getId());
    assertEquals(10L, result.get(0).getFoundItemId());
    assertEquals(2L, result.get(0).getUserId());
    assertEquals(ClaimStatus.PENDING, result.get(0).getStatus());

    verify(claimRepository).findByUserId(2L);
}


@Test
void updateClaimStatus_WhenRejected_NotifiesStudentAndKeepsItemAvailable() {
    // Arrange
    foundItem.setStatus(ItemStatus.FOUND);
    foundItem.setModerationStatus(ModerationStatus.APPROVED);

    Claim claim = Claim.builder()
            .id(100L)
            .foundItem(foundItem)
            .user(student)
            .status(ClaimStatus.PENDING)
            .createdAt(LocalDateTime.now())
            .build();

    when(claimRepository.findById(100L))
            .thenReturn(Optional.of(claim));

    when(claimRepository.save(any(Claim.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

    // Act
    ClaimResponse response =
            claimService.updateClaimStatus(100L, ClaimStatus.REJECTED);

    // Assert
    assertEquals(ClaimStatus.REJECTED, response.getStatus());
    assertEquals(ItemStatus.FOUND, foundItem.getStatus());

    verify(claimRepository).save(claim);

    verify(foundItemRepository, never())
            .findByIdForUpdate(any());

    verify(foundItemRepository, never())
            .save(any(FoundItem.class));

    verify(notificationService).createNotification(
            "student@college.com",
            NotificationType.CLAIM_REJECTED,
            "Your claim for item: Red Water Bottle has been rejected."
    );
}



@Test
void updateClaimStatus_WhenNewStatusIsPending_ThrowsException() {
    assertThrows(
            IllegalArgumentException.class,
            () -> claimService.updateClaimStatus(
                    100L, ClaimStatus.PENDING)
    );

    verifyNoInteractions(claimRepository);
}

}