package com.campusconnect.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.campusconnect.entity.LostItem;
import com.campusconnect.entity.FoundItem;
import org.springframework.web.bind.annotation.RequestParam;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.dto.UserStatusRequest;
import com.campusconnect.entity.Claim;
import com.campusconnect.entity.Handover;
import com.campusconnect.entity.User;
import com.campusconnect.service.AdminService;
import jakarta.validation.Valid;
import com.campusconnect.dto.ModerationRequest;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/claims")
    public ResponseEntity<List<Claim>> getAllClaims() {
        return ResponseEntity.ok(adminService.getAllClaims());
    }

    @GetMapping("/handovers")
    public ResponseEntity<List<Handover>> getAllHandovers() {
        return ResponseEntity.ok(adminService.getAllHandovers());
    }

    @PutMapping("/users/{userId}/status")
    public ResponseEntity<User> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody UserStatusRequest request) {

        return ResponseEntity.ok(
                adminService.updateUserStatus(userId, request)
        );
    }
    @GetMapping("/lost-items")
    public ResponseEntity<List<LostItem>> getAllLostItems() {
        return ResponseEntity.ok(adminService.getAllLostItems());
    }

    @GetMapping("/found-items")
    public ResponseEntity<List<FoundItem>> getAllFoundItems() {
        return ResponseEntity.ok(adminService.getAllFoundItems());
    }

    @GetMapping("/lost-items/pending")
    public ResponseEntity<List<LostItem>> getPendingLostItems() {
        return ResponseEntity.ok(adminService.getPendingLostItems());
    }

    @GetMapping("/found-items/pending")
    public ResponseEntity<List<FoundItem>> getPendingFoundItems() {
        return ResponseEntity.ok(adminService.getPendingFoundItems());
    }

    @PutMapping("/lost-items/{itemId}/moderation")
    public ResponseEntity<LostItem> moderateLostItem(
            @PathVariable Long itemId,
            @Valid @RequestBody ModerationRequest request) {

        return ResponseEntity.ok(
                adminService.moderateLostItem(itemId, request));
    }

    
    @PutMapping("/found-items/{itemId}/moderation")
    public ResponseEntity<FoundItem> moderateFoundItem(
            @PathVariable Long itemId,
            @Valid @RequestBody ModerationRequest request) {

        return ResponseEntity.ok(
                adminService.moderateFoundItem(itemId, request));
    }

}