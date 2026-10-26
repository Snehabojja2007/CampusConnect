package com.campusconnect.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.campusconnect.entity.Claim;

public interface ClaimRepository extends JpaRepository<Claim, Long> {

    List<Claim> findByUserId(Long userId);

    List<Claim> findByFoundItemId(Long foundItemId);

    boolean existsByUserIdAndFoundItemId(Long userId, Long foundItemId);

    List<Claim> findAllByOrderByCreatedAtDesc();
}