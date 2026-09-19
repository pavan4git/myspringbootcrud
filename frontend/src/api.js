const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (response.status === 204) {
    return null
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(payload)
  }

  return payload
}

export class ApiError extends Error {
  constructor(problem) {
    super(problem?.detail ?? problem?.title ?? 'Something went wrong')
    this.name = 'ApiError'
    // Spring's ProblemDetail carries our per-field messages under `errors`.
    this.fieldErrors = problem?.errors ?? {}
  }
}

export const listTasks = (status) =>
  request(`/api/tasks${status ? `?status=${status}` : ''}`)

export const createTask = (task) =>
  request('/api/tasks', { method: 'POST', body: JSON.stringify(task) })

export const updateTask = (id, task) =>
  request(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify(task) })

export const deleteTask = (id) =>
  request(`/api/tasks/${id}`, { method: 'DELETE' })
