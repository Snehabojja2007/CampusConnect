
package com.campusconnect.service;

import com.campusconnect.entity.Claim;
import com.campusconnect.entity.ClaimStatus;
import com.campusconnect.entity.FoundItem;
import com.campusconnect.entity.ItemStatus;
import com.campusconnect.entity.ModerationStatus;
import com.campusconnect.entity.Notification;
import com.campusconnect.entity.Role;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ConflictException;
import com.campusconnect.repository.ClaimRepository;
import com.campusconnect.repository.FoundItemRepository;
import com.campusconnect.repository.NotificationRepository;
import com.campusconnect.repository.UserRepository;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.transaction.support.TransactionTemplate;

import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers
class ClaimConcurrencyMySqlTest {

    @Container
    @ServiceConnection
    static final MySQLContainer mysql =
            new MySQLContainer("mysql:8.4");

    @Autowired
    private ClaimService claimService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FoundItemRepository foundItemRepository;

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Test
    void onlyOneConcurrentClaimApprovalCanSucceed() throws Exception {
        // Arrange: create clean test data in a committed transaction.
        TestData data = transactionTemplate.execute(status -> {
            User student1 = createStudent("concurrent1@college.com");
            User student2 = createStudent("concurrent2@college.com");

            userRepository.saveAll(List.of(student1, student2));

            FoundItem item = FoundItem.builder()
                    .title("Concurrency Test Wallet")
                    .description("Wallet created for concurrency test")
                    .location("Test Building")
                    .foundDate(LocalDate.now())
                    .status(ItemStatus.FOUND)
                    .moderationStatus(ModerationStatus.APPROVED)
                    .createdAt(LocalDateTime.now())
                    .user(student1)
                    .build();

            foundItemRepository.save(item);

            Claim claim1 = createPendingClaim(item, student1);
            Claim claim2 = createPendingClaim(item, student2);

            claimRepository.saveAll(List.of(claim1, claim2));

            return new TestData(item.getId(), claim1.getId(), claim2.getId());
        });

        assertNotNull(data);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        AtomicInteger conflicts = new AtomicInteger();

        ExecutorService executor = Executors.newFixedThreadPool(2);

        Callable<Void> approveFirst = () -> {
            runApproval(data.claim1Id(), ready, start, successes, conflicts);
            return null;
        };

        Callable<Void> approveSecond = () -> {
            runApproval(data.claim2Id(), ready, start, successes, conflicts);
            return null;
        };

        try {
            Future<Void> first = executor.submit(approveFirst);
            Future<Void> second = executor.submit(approveSecond);

            assertTrue(ready.await(10, TimeUnit.SECONDS),
                    "Both approval tasks should be ready");

            start.countDown();

            first.get(30, TimeUnit.SECONDS);
            second.get(30, TimeUnit.SECONDS);
        } finally {
            start.countDown();
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(10, TimeUnit.SECONDS),
                    "Approval threads should terminate");
        }

        // Assert: exactly one approval succeeds.
        assertEquals(1, successes.get());
        assertEquals(1, conflicts.get());

        // Verify the committed database state.
        transactionTemplate.executeWithoutResult(status -> {
            FoundItem savedItem = foundItemRepository.findById(data.itemId())
                    .orElseThrow();

            List<Claim> claims =
                    claimRepository.findByFoundItemId(data.itemId());

            assertEquals(ItemStatus.CLAIMED, savedItem.getStatus());
            assertEquals(2, claims.size());

            assertEquals(
                    1,
                    claims.stream()
                            .filter(c -> c.getStatus() == ClaimStatus.APPROVED)
                            .count());

            assertEquals(
                    1,
                    claims.stream()
                            .filter(c -> c.getStatus() == ClaimStatus.PENDING)
                            .count());

            List<Notification> notifications =
                    notificationRepository.findAll();

            assertEquals(
                    1,
                    notifications.stream()
                            .filter(n -> n.getType()
                                    == com.campusconnect.entity.NotificationType.CLAIM_APPROVED)
                            .filter(n -> n.getMessage().contains(
                                    "Concurrency Test Wallet"))
                            .count());
        });
    }

    private void runApproval(
            Long claimId,
            CountDownLatch ready,
            CountDownLatch start,
            AtomicInteger successes,
            AtomicInteger conflicts) throws InterruptedException {

        ready.countDown();

        if (!start.await(10, TimeUnit.SECONDS)) {
            throw new IllegalStateException("Timed out waiting to start approvals");
        }

        try {
            claimService.updateClaimStatus(claimId, ClaimStatus.APPROVED);
            successes.incrementAndGet();
        } catch (ConflictException exception) {
            conflicts.incrementAndGet();
        }
    }

    private User createStudent(String email) {
        return User.builder()
                .name("Concurrency Test Student")
                .email(email)
                .password("test-password")
                .role(Role.STUDENT)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private Claim createPendingClaim(FoundItem item, User student) {
        return Claim.builder()
                .foundItem(item)
                .user(student)
                .status(ClaimStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    private record TestData(Long itemId, Long claim1Id, Long claim2Id) {
    }
}
