
package com.campusconnect.config;

import com.campusconnect.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ClaimSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void studentCannotUpdateClaimStatus() throws Exception {
        when(jwtService.extractEmail("student-token"))
                .thenReturn("student@example.com");

        when(jwtService.extractRole("student-token"))
                .thenReturn("STUDENT");

        mockMvc.perform(
                put("/api/claims/100/status")
                        .param("status", "APPROVED")
                        .header("Authorization", "Bearer student-token")
        )
        .andExpect(status().isForbidden());
    }

    
@Test
void securityUserCanAccessClaimStatusEndpoint() throws Exception {
    when(jwtService.extractEmail("security-token"))
            .thenReturn("security@example.com");

    when(jwtService.extractRole("security-token"))
            .thenReturn("SECURITY");

    mockMvc.perform(
            put("/api/claims/100/status")
                    .param("status", "APPROVED")
                    .header("Authorization", "Bearer security-token")
    )
    .andExpect(status().isNotFound());
}


@Test
void adminCanAccessClaimStatusEndpoint() throws Exception {
    when(jwtService.extractEmail("admin-token"))
            .thenReturn("admin@example.com");

    when(jwtService.extractRole("admin-token"))
            .thenReturn("ADMIN");

    mockMvc.perform(
            put("/api/claims/100/status")
                    .param("status", "APPROVED")
                    .header("Authorization", "Bearer admin-token")
    )
    .andExpect(status().isNotFound());
}


@Test
void malformedTokenDoesNotAllowAccess() throws Exception {
    when(jwtService.extractEmail("invalid-token"))
            .thenThrow(new io.jsonwebtoken.MalformedJwtException("Invalid JWT"));

    mockMvc.perform(
            put("/api/claims/100/status")
                    .param("status", "APPROVED")
                    .header("Authorization", "Bearer invalid-token")
    )
    .andExpect(status().isUnauthorized());
}


}