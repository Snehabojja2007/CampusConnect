package com.campusconnect.controller;

import com.campusconnect.dto.LostItemRequest;
import com.campusconnect.entity.LostItem;
import com.campusconnect.service.LostItemService;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lost-items")
public class LostItemController {

    private final LostItemService lostItemService;

    public LostItemController(LostItemService lostItemService) {
        this.lostItemService = lostItemService;
    }

    @PostMapping
    public ResponseEntity<LostItem> createLostItem(
            @Valid @RequestBody LostItemRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        LostItem lostItem =
                lostItemService.createLostItem(request, email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(lostItem);
    }

    @GetMapping
    public ResponseEntity<Page<LostItem>> getLostItems(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String title,
            Pageable pageable) {

        Page<LostItem> lostItems;

        if (location != null && !location.isBlank()
                && title != null && !title.isBlank()) {

            lostItems = lostItemService.searchByLocationAndTitle(
                    location,
                    title,
                    pageable
            );

        } else if (location != null && !location.isBlank()) {

            lostItems = lostItemService.searchByLocation(
                    location,
                    pageable
            );

        } else if (title != null && !title.isBlank()) {

            lostItems = lostItemService.searchByTitle(
                    title,
                    pageable
            );

        } else {

            lostItems = lostItemService.getAllLostItems(
                    pageable
            );
        }

        return ResponseEntity.ok(lostItems);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLostItem(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        lostItemService.deleteLostItem(id, email);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<LostItem> updateLostItem(
            @PathVariable Long id,
            @Valid @RequestBody LostItemRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        LostItem updatedItem =
                lostItemService.updateLostItem(
                        id,
                        request,
                        email
                );

        return ResponseEntity.ok(updatedItem);
    }
}