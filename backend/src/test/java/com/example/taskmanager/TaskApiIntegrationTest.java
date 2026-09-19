package com.example.taskmanager;

import com.example.taskmanager.repository.TaskRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void cleanDatabase() {
        taskRepository.deleteAll();
    }

    @Test
    void createsAndReadsBackATask() throws Exception {
        String body = """
                {"title":"Buy milk","description":"2 litres","status":"TODO","dueDate":"2026-10-01"}
                """;

        String location = mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.title").value("Buy milk"))
                .andExpect(jsonPath("$.status").value("TODO"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andReturn()
                .getResponse()
                .getHeader("Location");

        mockMvc.perform(get(location))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.description").value("2 litres"))
                .andExpect(jsonPath("$.dueDate").value("2026-10-01"));
    }

    @Test
    void listsTasksAndFiltersByStatus() throws Exception {
        mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Open task\",\"status\":\"TODO\"}")).andExpect(status().isCreated());
        mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"Finished task\",\"status\":\"DONE\"}")).andExpect(status().isCreated());

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/tasks").param("status", "DONE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Finished task"));
    }

    @Test
    void updatesAnExistingTask() throws Exception {
        String location = mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Draft report\",\"status\":\"TODO\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        mockMvc.perform(put(location).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Draft report\",\"description\":\"Q3 numbers\",\"status\":\"IN_PROGRESS\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.description").value("Q3 numbers"));
    }

    @Test
    void updateResponseCarriesARefreshedUpdatedAt() throws Exception {
        String location = mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Track timestamps\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        String created = mockMvc.perform(get(location)).andReturn().getResponse().getContentAsString();
        String createdAt = JsonPath.read(created, "$.createdAt");

        String updated = mockMvc.perform(put(location).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Track timestamps\",\"status\":\"DONE\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        assertThat(Instant.parse(JsonPath.<String>read(updated, "$.updatedAt")))
                .isAfter(Instant.parse(createdAt));
    }

    @Test
    void deletesATaskAndThenReturns404() throws Exception {
        String location = mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Temporary\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getHeader("Location");

        mockMvc.perform(delete(location)).andExpect(status().isNoContent());
        mockMvc.perform(get(location)).andExpect(status().isNotFound());
    }

    @Test
    void rejectsATaskWithoutATitle() throws Exception {
        mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"  \",\"description\":\"no title\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.title").value("title must not be blank"));
    }

    @Test
    void returns404WhenUpdatingAMissingTask() throws Exception {
        mockMvc.perform(put("/api/tasks/999999").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Ghost\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Task not found with id 999999"));
    }

    @Test
    void defaultsStatusToTodoWhenOmitted() throws Exception {
        mockMvc.perform(post("/api/tasks").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"No status given\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("TODO"));
    }
}
