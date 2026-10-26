
package com.campusconnect.service;

import com.campusconnect.dto.ModerationRequest;
import com.campusconnect.entity.Claim;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.Handover;
import com.campusconnect.entity.LostItem;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.exception.ConflictException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.ClaimRepository;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.HandoverRepository;
import com.campusconnect.repository.LostItemRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.dto.UserStatusRequest;
import com.campusconnect.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClaimRepository claimRepository;

    @Mock
    private HandoverRepository handoverRepository;

    @Mock
    private LostItemRepository lostItemRepository;

    @Mock
    private FoundItemRepository foundItemRepository;

    @InjectMocks
    private AdminService adminService;

    private FoundItem foundItem;

    @BeforeEach
    void setUp() {
        foundItem = new FoundItem();
        foundItem.setModerationStatus(ModerationStatus.PENDING);
    }

    @Test
    void moderateFoundItem_WhenPendingAndApproved_SavesApprovedItem() {
        ModerationRequest request = mock(ModerationRequest.class);
        when(request.getModerationStatus())
                .thenReturn(ModerationStatus.APPROVED);

        when(foundItemRepository.findById(1L))
                .thenReturn(Optional.of(foundItem));
        when(foundItemRepository.save(foundItem))
                .thenReturn(foundItem);

        FoundItem result =
                adminService.moderateFoundItem(1L, request);

        assertSame(foundItem, result);
        assertEquals(
                ModerationStatus.APPROVED,
                result.getModerationStatus()
        );

        verify(foundItemRepository).findById(1L);
        verify(foundItemRepository).save(foundItem);
    }

    @Test
    void moderateFoundItem_WhenItemDoesNotExist_ThrowsException() {
        ModerationRequest request = mock(ModerationRequest.class);

        when(foundItemRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> adminService.moderateFoundItem(1L, request)
        );

        verify(foundItemRepository, never()).save(any());
    }

    @Test
    void moderateFoundItem_WhenItemIsNotPending_ThrowsConflict() {
        foundItem.setModerationStatus(ModerationStatus.APPROVED);

        ModerationRequest request = mock(ModerationRequest.class);

        when(foundItemRepository.findById(1L))
                .thenReturn(Optional.of(foundItem));

        assertThrows(
                ConflictException.class,
                () -> adminService.moderateFoundItem(1L, request)
        );

        verify(foundItemRepository, never()).save(any());
    }

    @Test
    void moderateFoundItem_WhenRequestedStatusIsPending_ThrowsException() {
        ModerationRequest request = mock(ModerationRequest.class);
        when(request.getModerationStatus())
                .thenReturn(ModerationStatus.PENDING);

        when(foundItemRepository.findById(1L))
                .thenReturn(Optional.of(foundItem));

        assertThrows(
                IllegalArgumentException.class,
                () -> adminService.moderateFoundItem(1L, request)
        );

        verify(foundItemRepository, never()).save(any());
    }

    
@Test
void moderateLostItem_WhenPendingAndApproved_SavesApprovedItem() {
    com.campusconnect.entity.LostItem lostItem =
            new com.campusconnect.entity.LostItem();

    lostItem.setModerationStatus(ModerationStatus.PENDING);

    ModerationRequest request = mock(ModerationRequest.class);
    when(request.getModerationStatus())
            .thenReturn(ModerationStatus.APPROVED);

    when(lostItemRepository.findById(2L))
            .thenReturn(Optional.of(lostItem));
    when(lostItemRepository.save(lostItem))
            .thenReturn(lostItem);

    var result = adminService.moderateLostItem(2L, request);

    assertSame(lostItem, result);
    assertEquals(ModerationStatus.APPROVED, result.getModerationStatus());

    verify(lostItemRepository).save(lostItem);
}

@Test
void moderateLostItem_WhenItemDoesNotExist_ThrowsException() {
    ModerationRequest request = mock(ModerationRequest.class);

    when(lostItemRepository.findById(2L))
            .thenReturn(Optional.empty());

    assertThrows(
            ResourceNotFoundException.class,
            () -> adminService.moderateLostItem(2L, request)
    );

    verify(lostItemRepository, never()).save(any());
}

@Test
void moderateLostItem_WhenItemIsNotPending_ThrowsConflict() {
    com.campusconnect.entity.LostItem lostItem =
            new com.campusconnect.entity.LostItem();

    lostItem.setModerationStatus(ModerationStatus.REJECTED);

    ModerationRequest request = mock(ModerationRequest.class);

    when(lostItemRepository.findById(2L))
            .thenReturn(Optional.of(lostItem));

    assertThrows(
            ConflictException.class,
            () -> adminService.moderateLostItem(2L, request)
    );

    verify(lostItemRepository, never()).save(any());
}

@Test
void moderateLostItem_WhenRequestedStatusIsPending_ThrowsException() {
    com.campusconnect.entity.LostItem lostItem =
            new com.campusconnect.entity.LostItem();

    lostItem.setModerationStatus(ModerationStatus.PENDING);

    ModerationRequest request = mock(ModerationRequest.class);
    when(request.getModerationStatus())
            .thenReturn(ModerationStatus.PENDING);

    when(lostItemRepository.findById(2L))
            .thenReturn(Optional.of(lostItem));

    assertThrows(
            IllegalArgumentException.class,
            () -> adminService.moderateLostItem(2L, request)
    );

    verify(lostItemRepository, never()).save(any());
}


@Test
void updateUserStatus_WhenUserExists_UpdatesAndSavesUser() {
    User user = new User();
    user.setActive(false);

    UserStatusRequest request = mock(UserStatusRequest.class);
    when(request.getActive()).thenReturn(true);

    when(userRepository.findById(10L))
            .thenReturn(Optional.of(user));
    when(userRepository.save(user))
            .thenReturn(user);

    User result = adminService.updateUserStatus(10L, request);

    assertSame(user, result);
    assertTrue(result.isActive());

    verify(userRepository).findById(10L);
    verify(userRepository).save(user);
}

@Test
void updateUserStatus_WhenUserDoesNotExist_ThrowsException() {
    UserStatusRequest request = mock(UserStatusRequest.class);

    when(userRepository.findById(10L))
            .thenReturn(Optional.empty());

    assertThrows(
            ResourceNotFoundException.class,
            () -> adminService.updateUserStatus(10L, request)
    );

    verify(userRepository, never()).save(any());
}


@Test
void getAllUsers_ReturnsUsersFromRepository() {
    List<User> users = List.of(new User());

    when(userRepository.findAllByOrderByCreatedAtDesc())
            .thenReturn(users);

    assertSame(users, adminService.getAllUsers());

    verify(userRepository).findAllByOrderByCreatedAtDesc();
}

@Test
void getAllClaims_ReturnsClaimsFromRepository() {
    List<Claim> claims = List.of(new Claim());

    when(claimRepository.findAllByOrderByCreatedAtDesc())
            .thenReturn(claims);

    assertSame(claims, adminService.getAllClaims());

    verify(claimRepository).findAllByOrderByCreatedAtDesc();
}

@Test
void getAllHandovers_ReturnsHandoversFromRepository() {
    List<Handover> handovers = List.of(new Handover());

    when(handoverRepository.findAllByOrderByCreatedAtDesc())
            .thenReturn(handovers);

    assertSame(handovers, adminService.getAllHandovers());

    verify(handoverRepository).findAllByOrderByCreatedAtDesc();
}

@Test
void getAllLostItems_ReturnsItemsFromRepository() {
    List<LostItem> items = List.of(new LostItem());

    when(lostItemRepository.findAllByOrderByCreatedAtDesc())
            .thenReturn(items);

    assertSame(items, adminService.getAllLostItems());

    verify(lostItemRepository).findAllByOrderByCreatedAtDesc();
}

@Test
void getAllFoundItems_ReturnsItemsFromRepository() {
    List<FoundItem> items = List.of(new FoundItem());

    when(foundItemRepository.findAllByOrderByCreatedAtDesc())
            .thenReturn(items);

    assertSame(items, adminService.getAllFoundItems());

    verify(foundItemRepository).findAllByOrderByCreatedAtDesc();
}

@Test
void getPendingLostItems_RequestsPendingItems() {
    List<LostItem> items = List.of(new LostItem());

    when(lostItemRepository
            .findByModerationStatusOrderByCreatedAtDesc(
                    ModerationStatus.PENDING))
            .thenReturn(items);

    assertSame(items, adminService.getPendingLostItems());

    verify(lostItemRepository)
            .findByModerationStatusOrderByCreatedAtDesc(
                    ModerationStatus.PENDING);
}

@Test
void getPendingFoundItems_RequestsPendingItems() {
    List<FoundItem> items = List.of(new FoundItem());

    when(foundItemRepository
            .findByModerationStatusOrderByCreatedAtDesc(
                    ModerationStatus.PENDING))
            .thenReturn(items);

    assertSame(items, adminService.getPendingFoundItems());

    verify(foundItemRepository)
            .findByModerationStatusOrderByCreatedAtDesc(
                    ModerationStatus.PENDING);
}


}
