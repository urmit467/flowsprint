import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import AnalyticsPanel from "../components/AnalyticsPanel";

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("board"); // board | analytics

  // Member management (project admin only)
  const [specialIdInput, setSpecialIdInput] = useState("");
  const [memberError, setMemberError] = useState("");

  // New task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskPoints, setTaskPoints] = useState(1);
  const [generating, setGenerating] = useState(false);

  // New sprint form state
  const [showSprintForm, setShowSprintForm] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");

  const [recommendation, setRecommendation] = useState("");
  const [loadingRec, setLoadingRec] = useState(false);

  const loadAll = async () => {
    const [projRes, sprintRes, taskRes] = await Promise.all([
      api.get(`/projects/${id}`),
      api.get(`/sprints/project/${id}`),
      api.get(`/tasks/project/${id}`),
    ]);
    setProject(projRes.data);
    setSprints(sprintRes.data);
    setTasks(taskRes.data);
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const handleGenerateDescription = async () => {
    if (!taskTitle) return;
    setGenerating(true);
    try {
      const { data } = await api.post("/tasks/generate-description", {
        title: taskTitle,
        projectContext: project?.name,
      });
      setTaskDesc(data.description);
    } catch (err) {
      alert(err.response?.data?.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    await api.post("/tasks", {
      title: taskTitle,
      description: taskDesc,
      project: id,
      storyPoints: taskPoints,
    });
    setTaskTitle("");
    setTaskDesc("");
    setTaskPoints(1);
    loadAll();
  };

  const handleUpdateTask = async (taskId, updates) => {
    await api.put(`/tasks/${taskId}`, updates);
    loadAll();
  };

  const handleDeleteTask = async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    loadAll();
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    await api.post("/sprints", {
      name: sprintName,
      project: id,
      startDate: sprintStart,
      endDate: sprintEnd,
    });
    setSprintName("");
    setSprintStart("");
    setSprintEnd("");
    setShowSprintForm(false);
    loadAll();
  };

  const handleSprintSummary = async (sprintId) => {
    const { data } = await api.post(`/sprints/${sprintId}/summary`);
    setSprints((prev) =>
      prev.map((s) => (s._id === sprintId ? { ...s, aiSummary: data.aiSummary } : s))
    );
  };

  const handleRecommendation = async () => {
    setLoadingRec(true);
    try {
      const { data } = await api.get(`/tasks/project/${id}/recommendation`);
      setRecommendation(data.recommendation);
    } catch (err) {
      alert(err.response?.data?.message || "Could not get recommendation");
    } finally {
      setLoadingRec(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setMemberError("");
    try {
      const { data } = await api.post(`/projects/${id}/members`, { specialId: specialIdInput });
      setProject(data);
      setSpecialIdInput("");
    } catch (err) {
      setMemberError(err.response?.data?.message || "Could not add member");
    }
  };

  const handleRemoveMember = async (userId) => {
    const { data } = await api.delete(`/projects/${id}/members/${userId}`);
    setProject(data);
  };

  if (!project) return <p className="center-msg">Loading project...</p>;

  const canManage = project.manager?._id === user._id || user.role === "admin";
  const backlogTasks = tasks.filter((t) => !t.sprint);
  const tasksBySprint = (sprintId) => tasks.filter((t) => t.sprint === sprintId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <p className="muted">{project.description}</p>
        </div>
        <div className="tabs">
          <button className={activeTab === "board" ? "tab active" : "tab"} onClick={() => setActiveTab("board")}>
            Board
          </button>
          <button className={activeTab === "analytics" ? "tab active" : "tab"} onClick={() => setActiveTab("analytics")}>
            Analytics
          </button>
          <button className={activeTab === "members" ? "tab active" : "tab"} onClick={() => setActiveTab("members")}>
            Members
          </button>
        </div>
      </div>

      {activeTab === "members" && (
        <div className="card">
          <h3>Admin</h3>
          <p className="muted">{project.manager?.name} ({project.manager?.specialId})</p>

          <h3>Members</h3>
          {project.members?.length === 0 && <p className="muted small">No members added yet.</p>}
          <div className="task-list">
            {project.members?.map((m) => (
              <div className="task-card" key={m._id}>
                <div className="flex-between">
                  <div>
                    <strong>{m.name}</strong>
                    <p className="muted small">{m.specialId} · {m.email}</p>
                  </div>
                  {canManage && (
                    <button className="btn-icon" onClick={() => handleRemoveMember(m._id)}>✕</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {canManage && (
            <form className="form" onSubmit={handleAddMember} style={{ marginTop: 16 }}>
              <h4>Add a member by special ID</h4>
              {memberError && <p className="error-text">{memberError}</p>}
              <div className="inline-row">
                <input
                  placeholder="e.g. FS-7K2P9X"
                  value={specialIdInput}
                  onChange={(e) => setSpecialIdInput(e.target.value)}
                  required
                />
                <button type="submit" className="btn-primary">Add</button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === "analytics" && (
        <>
          <AnalyticsPanel tasks={tasks} />
          {canManage && (
            <div className="card">
              <div className="flex-between">
                <h4>AI Productivity Recommendation</h4>
                <button className="btn-secondary" onClick={handleRecommendation} disabled={loadingRec}>
                  {loadingRec ? "Thinking..." : "Get Recommendation"}
                </button>
              </div>
              {recommendation && <p className="ai-text">{recommendation}</p>}
            </div>
          )}
        </>
      )}

      {activeTab === "board" && (
        <div className="board-layout">
          {canManage && (
            <div className="card form">
              <h4>New Task</h4>
              <input
                placeholder="Task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
              />
              <textarea
                placeholder="Description"
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
              />
              <button type="button" className="btn-secondary" onClick={handleGenerateDescription} disabled={generating || !taskTitle}>
                {generating ? "Generating..." : "✨ AI Generate Description"}
              </button>
              <div className="inline-row">
                <label>
                  Story points:
                  <input
                    type="number"
                    min="0"
                    value={taskPoints}
                    onChange={(e) => setTaskPoints(Number(e.target.value))}
                  />
                </label>
                <button className="btn-primary" onClick={handleCreateTask}>Add Task</button>
              </div>
            </div>
          )}

          <div className="card">
            <h3>Backlog</h3>
            <div className="task-list">
              {backlogTasks.length === 0 && <p className="muted small">No backlog tasks.</p>}
              {backlogTasks.map((t) => (
                <TaskCard
                  key={t._id}
                  task={t}
                  sprints={sprints}
                  canManage={canManage}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </div>

          <div className="page-header">
            <h3>Sprints</h3>
            {canManage && (
              <button className="btn-secondary" onClick={() => setShowSprintForm(!showSprintForm)}>
                {showSprintForm ? "Cancel" : "+ New Sprint"}
              </button>
            )}
          </div>

          {showSprintForm && (
            <form className="card form" onSubmit={handleCreateSprint}>
              <input placeholder="Sprint name" value={sprintName} onChange={(e) => setSprintName(e.target.value)} required />
              <div className="inline-row">
                <label>Start: <input type="date" value={sprintStart} onChange={(e) => setSprintStart(e.target.value)} required /></label>
                <label>End: <input type="date" value={sprintEnd} onChange={(e) => setSprintEnd(e.target.value)} required /></label>
              </div>
              <button type="submit" className="btn-primary">Create Sprint</button>
            </form>
          )}

          {sprints.map((sprint) => (
            <div className="card" key={sprint._id}>
              <div className="flex-between">
                <h3>{sprint.name} <span className="muted small">({sprint.status})</span></h3>
                {canManage && (
                  <button className="btn-secondary" onClick={() => handleSprintSummary(sprint._id)}>
                    ✨ AI Summary
                  </button>
                )}
              </div>
              {sprint.aiSummary && <p className="ai-text">{sprint.aiSummary}</p>}
              <div className="task-list">
                {tasksBySprint(sprint._id).length === 0 && <p className="muted small">No tasks in this sprint.</p>}
                {tasksBySprint(sprint._id).map((t) => (
                  <TaskCard
                    key={t._id}
                    task={t}
                    sprints={sprints}
                    canManage={canManage}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;
