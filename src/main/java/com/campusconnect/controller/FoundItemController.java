package com.campusconnect.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.campusconnect.dto.FoundItemRequest;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.service.FoundItemService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/found-items")
public class FoundItemController {

    private final FoundItemService foundItemService;

    public FoundItemController(FoundItemService foundItemService) {
        this.foundItemService = foundItemService;
    }

    @PostMapping
    public ResponseEntity<FoundItem> createFoundItem(
            @Valid @RequestBody FoundItemRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        FoundItem foundItem =
                foundItemService.createFoundItem(request, email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(foundItem);
    }

    @GetMapping
    public ResponseEntity<Page<FoundItem>> getFoundItems(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String title,
            Pageable pageable) {

        Page<FoundItem> foundItems;

        if (location != null && !location.isBlank()
                && title != null && !title.isBlank()) {

            foundItems =
                    foundItemService.searchByLocationAndTitle(
                            location,
                            title,
                            pageable
                    );

        } else if (location != null && !location.isBlank()) {

            foundItems =
                    foundItemService.searchByLocation(
                            location,
                            pageable
                    );

        } else if (title != null && !title.isBlank()) {

            foundItems =
                    foundItemService.searchByTitle(
                            title,
                            pageable
                    );

        } else {

            foundItems =
                    foundItemService.getAllFoundItems(
                            pageable
                    );
        }

        return ResponseEntity.ok(foundItems);
    }

    @PutMapping("/{id}")
    public ResponseEntity<FoundItem> updateFoundItem(
            @PathVariable Long id,
            @Valid @RequestBody FoundItemRequest request,
            Authentication authentication) {

        String email = authentication.getName();

        FoundItem updatedItem =
                foundItemService.updateFoundItem(
                        id,
                        request,
                        email
                );

        return ResponseEntity.ok(updatedItem);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFoundItem(
            @PathVariable Long id,
            Authentication authentication) {

        String email = authentication.getName();

        foundItemService.deleteFoundItem(id, email);

        return ResponseEntity.noContent().build();
    }
}