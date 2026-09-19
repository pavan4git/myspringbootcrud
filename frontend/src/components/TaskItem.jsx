import { STATUSES, STATUS_LABELS } from '../constants'

function formatDueDate(dueDate) {
  if (!dueDate) return null
  // dueDate is a plain yyyy-mm-dd string; parse the parts so it is not
  // shifted a day by the browser's timezone.
  const [year, month, day] = dueDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function isOverdue(task) {
  if (!task.dueDate || task.status === 'DONE') return false
  const today = new Date().toISOString().slice(0, 10)
  return task.dueDate < today
}

export default function TaskItem({ task, onEdit, onDelete, onStatusChange, busy }) {
  const due = formatDueDate(task.dueDate)

  return (
    <li className={`task-item status-${task.status.toLowerCase()}`}>
      <div className="task-main">
        <h3>{task.title}</h3>
        {task.description && <p className="task-description">{task.description}</p>}
        <div className="task-meta">
          <span className={`badge badge-${task.status.toLowerCase()}`}>
            {STATUS_LABELS[task.status]}
          </span>
          {due && (
            <span className={isOverdue(task) ? 'due overdue' : 'due'}>
              Due {due}
              {isOverdue(task) && ' · overdue'}
            </span>
          )}
        </div>
      </div>

      <div className="task-actions">
        <label className="sr-only" htmlFor={`status-${task.id}`}>
          Status for {task.title}
        </label>
        <select
          id={`status-${task.id}`}
          value={task.status}
          onChange={(event) => onStatusChange(task, event.target.value)}
          disabled={busy}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button type="button" className="secondary" onClick={() => onEdit(task)} disabled={busy}>
          Edit
        </button>
        <button type="button" className="danger" onClick={() => onDelete(task)} disabled={busy}>
          Delete
        </button>
      </div>
    </li>
  )
}
