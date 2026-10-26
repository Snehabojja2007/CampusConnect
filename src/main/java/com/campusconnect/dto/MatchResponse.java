package com.campusconnect.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class MatchResponse {

    private Long lostItemId;
    private Long foundItemId;

    private String lostItemTitle;
    private String foundItemTitle;

    private String lostItemLocation;
    private String foundItemLocation;

    private int matchScore;
}