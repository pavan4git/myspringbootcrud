import { useCallback, useEffect, useMemo, useState } from 'react'
import { createTask, deleteTask, listTasks, updateTask } from './api'
import TaskForm from './components/TaskForm'
import TaskItem from './components/TaskItem'
import { STATUSES, STATUS_LABELS } from './constants'
import './App.css'

export default function App() {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [editingTask, setEditingTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // `loading` only covers the very first fetch; later refreshes swap the list
  // in place rather than flashing a spinner.
  const refresh = useCallback(async (status) => {
    try {
      const data = await listTasks(status === 'ALL' ? null : status)
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(
        `${err.message}. Is the API running on ${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}?`,
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Fetching from the API is exactly the "synchronise with an external
    // system" case effects exist for; the rule cannot see that refresh()
    // only touches state after its await.
    // eslint-disable-next-line react/set-state-in-effect
    refresh(filter)
  }, [filter, refresh])

  const handleSubmit = async (values) => {
    setBusy(true)
    try {
      if (editingTask) {
        await updateTask(editingTask.id, values)
        setEditingTask(null)
      } else {
        await createTask(values)
      }
      await refresh(filter)
    } finally {
      setBusy(false)
    }
  }

  const handleStatusChange = async (task, status) => {
    setBusy(true)
    try {
      await updateTask(task.id, {
        title: task.title,
        description: task.description,
        status,
        dueDate: task.dueDate,
      })
      await refresh(filter)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    setBusy(true)
    try {
      await deleteTask(task.id)
      if (editingTask?.id === task.id) {
        setEditingTask(null)
      }
      await refresh(filter)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const counts = useMemo(() => {
    const open = tasks.filter((task) => task.status !== 'DONE').length
    return { open, total: tasks.length }
  }, [tasks])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Manager</h1>
        <p className="subtitle">
          {loading
            ? 'Loading…'
            : `${counts.total} task${counts.total === 1 ? '' : 's'} · ${counts.open} open`}
        </p>
      </header>

      {error && <div className="banner error">{error}</div>}

      <TaskForm
        key={editingTask?.id ?? 'new'}
        editingTask={editingTask}
        onSubmit={handleSubmit}
        onCancel={() => setEditingTask(null)}
        busy={busy}
      />

      <section className="task-list-section">
        <div className="filters">
          {['ALL', ...STATUSES].map((status) => (
            <button
              key={status}
              type="button"
              className={filter === status ? 'filter active' : 'filter'}
              onClick={() => setFilter(status)}
            >
              {status === 'ALL' ? 'All' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="empty">Loading tasks…</p>
        ) : tasks.length === 0 ? (
          <p className="empty">
            {filter === 'ALL' ? 'No tasks yet — add your first one above.' : 'Nothing here.'}
          </p>
        ) : (
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                busy={busy}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
