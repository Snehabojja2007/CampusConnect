package com.campusconnect.controller;

import com.campusconnect.dto.MatchResponse;
import com.campusconnect.service.MatchingService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
public class MatchingController {

    private final MatchingService matchingService;

    public MatchingController(MatchingService matchingService) {
        this.matchingService = matchingService;
    }

    @GetMapping("/lost/{lostItemId}")
    public ResponseEntity<List<MatchResponse>> findMatches(
            @PathVariable Long lostItemId) {

        return ResponseEntity.ok(
                matchingService.findMatches(lostItemId)
        );
    }
}