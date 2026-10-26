package com.campusconnect.service;

import org.springframework.stereotype.Service;

import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.exception.ForbiddenException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.LostItemRepository;

@Service
public class MatchingService {

    private final LostItemRepository lostItemRepository;
    private final FoundItemRepository foundItemRepository;

    public MatchingService(
            LostItemRepository lostItemRepository,
            FoundItemRepository foundItemRepository) {

        this.lostItemRepository = lostItemRepository;
        this.foundItemRepository = foundItemRepository;
    }
    private double calculateTitleSimilarity(
            String lostTitle,
            String foundTitle) {

        String[] lostWords =
                lostTitle.toLowerCase().split("\\s+");

        String[] foundWords =
                foundTitle.toLowerCase().split("\\s+");

        int matchingWords = 0;

        for (String lostWord : lostWords) {

            for (String foundWord : foundWords) {

                if (lostWord.equals(foundWord)) {
                    matchingWords++;
                    break;
                }
            }
        }

        return (double) matchingWords / lostWords.length;
    }
    private boolean isLocationMatch(
            String lostLocation,
            String foundLocation) {

        return lostLocation.trim()
                .equalsIgnoreCase(foundLocation.trim());
    }
    private boolean isDateMatch(
            java.time.LocalDate lostDate,
            java.time.LocalDate foundDate) {

        long daysDifference =
                java.time.temporal.ChronoUnit.DAYS.between(
                        lostDate,
                        foundDate
                );

        return daysDifference >= 0 && daysDifference <= 3;
    }
    private int calculateMatchScore(
            String lostTitle,
            String foundTitle,
            String lostLocation,
            String foundLocation,
            java.time.LocalDate lostDate,
            java.time.LocalDate foundDate) {

        double titleSimilarity =
                calculateTitleSimilarity(
                        lostTitle,
                        foundTitle
                );

        boolean locationMatch =
                isLocationMatch(
                        lostLocation,
                        foundLocation
                );

        boolean dateMatch =
                isDateMatch(
                        lostDate,
                        foundDate
                );

        int score = 0;

        score += (int) (titleSimilarity * 50);

        if (locationMatch) {
            score += 30;
        }

        if (dateMatch) {
            score += 20;
        }

        return score;
    }
    public java.util.List<com.campusconnect.dto.MatchResponse> findMatches(
            Long lostItemId) {

        com.campusconnect.entity.LostItem lostItem =
        lostItemRepository.findById(lostItemId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Lost item not found"));

        if (lostItem.getModerationStatus() != ModerationStatus.APPROVED) {
        throw new ForbiddenException(
                "Matching is available only for approved lost items");
        }

        java.util.List<com.campusconnect.entity.FoundItem> foundItems =
        foundItemRepository.findByModerationStatusOrderByCreatedAtDesc(
                ModerationStatus.APPROVED);

        java.util.List<com.campusconnect.dto.MatchResponse> matches =
                new java.util.ArrayList<>();

        for (com.campusconnect.entity.FoundItem foundItem : foundItems) {

            int score = calculateMatchScore(
                    lostItem.getTitle(),
                    foundItem.getTitle(),
                    lostItem.getLocation(),
                    foundItem.getLocation(),
                    lostItem.getLostDate(),
                    foundItem.getFoundDate()
            );

            if (score > 0) {

                matches.add(
                        new com.campusconnect.dto.MatchResponse(
                                lostItem.getId(),
                                foundItem.getId(),
                                lostItem.getTitle(),
                                foundItem.getTitle(),
                                lostItem.getLocation(),
                                foundItem.getLocation(),
                                score
                        )
                );
            }
        }

        matches.sort(
                (a, b) ->
                        Integer.compare(
                                b.getMatchScore(),
                                a.getMatchScore()
                        )
        );
        return matches;
    }
}