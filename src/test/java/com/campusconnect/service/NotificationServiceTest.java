
package com.campusconnect.service;

import com.campusconnect.entity.Notification;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.NotificationRepository;
import com.campusconnect.repository.UserRepository;

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
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationService notificationService;

    private User owner;
    private User otherUser;
    private Notification notification;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .email("owner@example.com")
                .build();

        otherUser = User.builder()
                .id(2L)
                .email("other@example.com")
                .build();

        notification = Notification.builder()
                .id(10L)
                .user(owner)
                .read(false)
                .build();
    }

    @Test
    void markAsRead_WhenNotificationBelongsToAnotherUser_ThrowsForbiddenException() {
        when(userRepository.findByEmail("other@example.com"))
                .thenReturn(Optional.of(otherUser));

        when(notificationRepository.findById(10L))
                .thenReturn(Optional.of(notification));

        assertThrows(
                ForbiddenException.class,
                () -> notificationService.markAsRead(
                        10L, "other@example.com")
        );

        verify(notificationRepository, never()).save(any(Notification.class));
    }
    
    @Test
    void markAsRead_WhenNotificationDoesNotExist_ThrowsResourceNotFoundException() {
        when(userRepository.findByEmail("owner@example.com"))
                .thenReturn(Optional.of(owner));

        when(notificationRepository.findById(10L))
                .thenReturn(Optional.empty());

        assertThrows(
                ResourceNotFoundException.class,
                () -> notificationService.markAsRead(
                        10L, "owner@example.com")
        );

        verify(notificationRepository, never()).save(any(Notification.class));
    }
}
