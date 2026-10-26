
package com.campusconnect.service;

import com.campusconnect.entity.LostItem;
import com.campusconnect.entity.ItemStatus;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.LostItemRepository;
import com.campusconnect.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import java.util.Optional;

import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LostItemServiceTest {

    @Mock
    private LostItemRepository lostItemRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LostItemService lostItemService;

    private User owner;
    private LostItem lostItem;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setEmail("owner@example.com");

        lostItem = LostItem.builder()
                .id(1L)
                .title("Lost Wallet")
                .description("Black wallet")
                .location("Library")
                .status(ItemStatus.LOST)
                .user(owner)
                .build();
    }

    @Test
    void deleteLostItem_WhenUserIsNotOwner_ThrowsForbiddenException() {
        when(lostItemRepository.findById(1L))
                .thenReturn(Optional.of(lostItem));

        assertThrows(
                ForbiddenException.class,
                () -> lostItemService.deleteLostItem(
                        1L, "other@example.com"));

        verify(lostItemRepository, never()).delete(any());
    }

    @Test
    void updateLostItem_WhenUserIsNotOwner_ThrowsForbiddenException() {
        when(lostItemRepository.findById(1L))
                .thenReturn(Optional.of(lostItem));

        assertThrows(
                ForbiddenException.class,
                () -> lostItemService.updateLostItem(
                        1L, null, "other@example.com"));

        verify(lostItemRepository, never()).save(any());
    }

    @Test
    void deleteLostItem_WhenItemDoesNotExist_ThrowsResourceNotFoundException() {
        when(lostItemRepository.findById(1L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> lostItemService.deleteLostItem(
                        1L, "owner@example.com"));

        verify(lostItemRepository, never()).delete(any());
    }
}
