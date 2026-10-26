package com.campusconnect.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.campusconnect.dto.ClaimRequest;
import com.campusconnect.dto.ClaimResponse;
import com.campusconnect.entity.ClaimStatus;
import com.campusconnect.service.ClaimService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/claims")
public class ClaimController {

    private final ClaimService claimService;

    public ClaimController(ClaimService claimService) {
        this.claimService = claimService;
    }

    @PostMapping
    public ResponseEntity<ClaimResponse> createClaim(
            @Valid @RequestBody ClaimRequest request,
            java.security.Principal principal) {

        ClaimResponse response =
                claimService.createClaim(
                        request,
                        principal.getName()
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    @GetMapping("/my")
    public ResponseEntity<java.util.List<ClaimResponse>> getMyClaims(
            java.security.Principal principal) {

        return ResponseEntity.ok(
                claimService.getMyClaims(principal.getName())
        );
    }

    @PutMapping("/{claimId}/status")
    public ResponseEntity<ClaimResponse> updateClaimStatus(
            @PathVariable Long claimId,
            @RequestParam ClaimStatus status) {

        ClaimResponse response =
                claimService.updateClaimStatus(
                        claimId,
                        status
                );

        return ResponseEntity.ok(response);
    }
}