package com.campusconnect.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.campusconnect.entity.Notification;
import com.campusconnect.entity.NotificationType;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.NotificationRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.exception.ForbiddenException;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository) {

        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public Notification createNotification(
            String email,
            NotificationType type,
            String message) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .read(false)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        return notificationRepository.save(notification);
    }

    public Page<Notification> getMyNotifications(
            String email,
            Pageable pageable) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(
                        user.getId(),
                        pageable
                );
    }
    public void markAsRead(
            Long notificationId,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("User not found"));

        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Notification not found"));


        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ForbiddenException(
                    "You are not allowed to modify this notification");
        }

        notification.setRead(true);

        notificationRepository.save(notification);
    }
}