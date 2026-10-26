package com.campusconnect.dto;

import com.campusconnect.entity.ModerationStatus;
import jakarta.validation.constraints.NotNull;

public class ModerationRequest {

    @NotNull(message = "Moderation status is required")
    private ModerationStatus moderationStatus;

    public ModerationStatus getModerationStatus() {
        return moderationStatus;
    }

    public void setModerationStatus(ModerationStatus moderationStatus) {
        this.moderationStatus = moderationStatus;
    }
}