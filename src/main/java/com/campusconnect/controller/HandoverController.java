package com.campusconnect.controller;

import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.campusconnect.entity.Handover;
import com.campusconnect.service.HandoverService;

@RestController
@RequestMapping("/api/handovers")
public class HandoverController {

    private final HandoverService handoverService;

    public HandoverController(HandoverService handoverService) {
        this.handoverService = handoverService;
    }

    @PostMapping
    public ResponseEntity<Handover> createHandover(
            @RequestParam Long claimId,
            Principal principal) {

        Handover handover = handoverService.createHandover(
                claimId,
                principal.getName()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(handover);
    }
    @PutMapping("/{handoverId}/complete")
    public ResponseEntity<Handover> completeHandover(
            @PathVariable Long handoverId,
            Principal principal) {

        Handover handover = handoverService.completeHandover(
                handoverId,
                principal.getName()
        );

        return ResponseEntity.ok(handover);
    }
    @GetMapping("/my")
    public ResponseEntity<List<Handover>> getMyHandovers(
            Principal principal) {

        List<Handover> handovers =
                handoverService.getMyHandovers(principal.getName());

        return ResponseEntity.ok(handovers);
    }
}