package com.campusconnect.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClaimRequest {

    @NotNull(message = "Found item ID is required")
    private Long foundItemId;
}