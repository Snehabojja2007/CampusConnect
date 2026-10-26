package com.campusconnect.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.campusconnect.entity.Handover;

public interface HandoverRepository extends JpaRepository<Handover, Long> {

    Optional<Handover> findByClaimId(Long claimId);

    List<Handover> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<Handover> findBySecurityUserIdOrderByCreatedAtDesc(Long securityUserId);

    List<Handover> findAllByOrderByCreatedAtDesc();
}