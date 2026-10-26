
package com.campusconnect.controller;

import com.campusconnect.service.AdminService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import com.campusconnect.entity.User;
import com.campusconnect.entity.Role;
import com.campusconnect.service.JwtService;
import java.util.List;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockitoBean
    private AdminService adminService;

    @Test
    void getAllUsers_WhenUnauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsers_WhenStudentAccessesAdminEndpoint_ReturnsForbidden()
            throws Exception {

        User student = new User();
        student.setEmail("student@test.com");
        student.setRole(Role.STUDENT);

        String token = jwtService.generateToken(student);

        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void getAllUsers_WhenAdminAccessesAdminEndpoint_ReturnsOk()
            throws Exception {

        User admin = new User();
        admin.setEmail("admin@test.com");
        admin.setRole(Role.ADMIN);

        String token = jwtService.generateToken(admin);

        when(adminService.getAllUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

}
