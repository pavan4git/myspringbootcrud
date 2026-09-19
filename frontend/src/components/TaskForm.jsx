import { useState } from 'react'
import { EMPTY_TASK, STATUSES, STATUS_LABELS } from '../constants'

// App gives this component a `key` derived from the task being edited, so
// switching tasks remounts it and the initialiser below seeds the fields.
export default function TaskForm({ editingTask, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState(() =>
    editingTask
      ? {
          title: editingTask.title ?? '',
          description: editingTask.description ?? '',
          status: editingTask.status ?? 'TODO',
          dueDate: editingTask.dueDate ?? '',
        }
      : EMPTY_TASK,
  )
  const [fieldErrors, setFieldErrors] = useState({})

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFieldErrors({})
    try {
      await onSubmit({
        title: form.title,
        description: form.description || null,
        status: form.status,
        // the API expects null rather than an empty string for an absent date
        dueDate: form.dueDate || null,
      })
      if (!editingTask) {
        setForm(EMPTY_TASK)
      }
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {})
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h2>{editingTask ? `Edit task #${editingTask.id}` : 'Add a task'}</h2>

      <label>
        Title
        <input
          value={form.title}
          onChange={update('title')}
          placeholder="What needs doing?"
          maxLength={200}
        />
      </label>
      {fieldErrors.title && <p className="field-error">{fieldErrors.title}</p>}

      <label>
        Description
        <textarea
          value={form.description}
          onChange={update('description')}
          placeholder="Any extra detail (optional)"
          rows={3}
          maxLength={2000}
        />
      </label>
      {fieldErrors.description && <p className="field-error">{fieldErrors.description}</p>}

      <div className="form-row">
        <label>
          Status
          <select value={form.status} onChange={update('status')}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <label>
          Due date
          <input type="date" value={form.dueDate} onChange={update('dueDate')} />
        </label>
      </div>

      <div className="form-actions">
        <button type="submit" disabled={busy}>
          {editingTask ? 'Save changes' : 'Add task'}
        </button>
        {editingTask && (
          <button type="button" className="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
