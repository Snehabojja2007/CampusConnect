
package com.campusconnect.service;

import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.ItemStatus;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ConflictException;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.dto.FoundItemRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import java.util.Optional;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoundItemServiceTest {

    @Mock
    private FoundItemRepository foundItemRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FoundItemService foundItemService;

    private User owner;
    private FoundItem foundItem;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setEmail("owner@example.com");

        foundItem = FoundItem.builder()
                .id(1L)
                .title("Water Bottle")
                .description("Red water bottle")
                .location("CSE Block")
                .status(ItemStatus.FOUND)
                .user(owner)
                .build();
    }

    @Test
    void deleteFoundItem_WhenItemIsClaimed_ThrowsConflictException() {
        foundItem.setStatus(ItemStatus.CLAIMED);

        when(foundItemRepository.findById(1L))
                .thenReturn(Optional.of(foundItem));

        assertThrows(
                ConflictException.class,
                () -> foundItemService.deleteFoundItem(
                        1L, "owner@example.com"));

        verify(foundItemRepository, never()).delete(any());
    }

    @Test
    void updateFoundItem_WhenItemIsClaimed_ThrowsConflictException() {
        foundItem.setStatus(ItemStatus.CLAIMED);

        when(foundItemRepository.findById(1L))
                .thenReturn(Optional.of(foundItem));

        FoundItemRequest request = new FoundItemRequest();

        assertThrows(
                ConflictException.class,
                () -> foundItemService.updateFoundItem(
                        1L, request, "owner@example.com"));

        verify(foundItemRepository, never()).save(any());
    }

    @Test
    void deleteFoundItem_WhenUserIsNotOwner_ThrowsForbiddenException() {
        when(foundItemRepository.findById(1L))
                .thenReturn(Optional.of(foundItem));

        assertThrows(
                ForbiddenException.class,
                () -> foundItemService.deleteFoundItem(
                        1L, "other@example.com"));

        verify(foundItemRepository, never()).delete(any());
    }
}
