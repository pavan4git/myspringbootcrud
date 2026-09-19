package com.example.taskmanager.service;

import com.example.taskmanager.dto.TaskRequest;
import com.example.taskmanager.dto.TaskResponse;
import com.example.taskmanager.exception.TaskNotFoundException;
import com.example.taskmanager.model.Task;
import com.example.taskmanager.model.TaskStatus;
import com.example.taskmanager.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findAll(TaskStatus status) {
        List<Task> tasks = status == null
                ? taskRepository.findAllByOrderByCreatedAtDesc()
                : taskRepository.findAllByStatusOrderByCreatedAtDesc(status);
        return tasks.stream().map(TaskResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public TaskResponse findById(Long id) {
        return TaskResponse.from(getTaskOrThrow(id));
    }

    public TaskResponse create(TaskRequest request) {
        Task task = new Task(
                request.title().trim(),
                request.description(),
                request.status(),
                request.dueDate()
        );
        return TaskResponse.from(taskRepository.save(task));
    }

    public TaskResponse update(Long id, TaskRequest request) {
        Task task = getTaskOrThrow(id);
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setStatus(request.status() == null ? TaskStatus.TODO : request.status());
        task.setDueDate(request.dueDate());
        // saveAndFlush so the @PreUpdate timestamp is applied before we map the response
        return TaskResponse.from(taskRepository.saveAndFlush(task));
    }

    public void delete(Long id) {
        Task task = getTaskOrThrow(id);
        taskRepository.delete(task);
    }

    private Task getTaskOrThrow(Long id) {
        return taskRepository.findById(id).orElseThrow(() -> new TaskNotFoundException(id));
    }
}
