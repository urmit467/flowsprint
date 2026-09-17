const STATUS_OPTIONS = ["todo", "in-progress", "review", "done"];

const TaskCard = ({ task, sprints, canManage, onUpdate, onDelete }) => {
  return (
    <div className="task-card">
      <div className="task-top">
        <span className={`priority-dot priority-${task.priority}`} title={task.priority} />
        <strong>{task.title}</strong>
      </div>
      {task.description && <p className="muted small">{task.description}</p>}

      <div className="task-controls">
        <select
          value={task.status}
          onChange={(e) => onUpdate(task._id, { status: e.target.value })}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {canManage && (
          <select
            value={task.sprint || ""}
            onChange={(e) => onUpdate(task._id, { sprint: e.target.value || null })}
          >
            <option value="">Backlog</option>
            {sprints.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        )}

        <span className="points-badge">{task.storyPoints} pts</span>

        {canManage && (
          <button className="btn-icon" onClick={() => onDelete(task._id)}>✕</button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
