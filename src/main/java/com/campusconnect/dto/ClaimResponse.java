package com.campusconnect.dto;

import com.campusconnect.entity.ClaimStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class ClaimResponse {

    private Long id;

    private Long foundItemId;
    private String foundItemTitle;

    private Long userId;
    private String userName;

    private ClaimStatus status;

    private LocalDateTime createdAt;
}