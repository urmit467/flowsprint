const Task = require("../models/Task");
const Project = require("../models/Project");
const { generateTaskDescription, generateProductivityRecommendation } = require("../services/llmService");
const { canManageProject } = require("./projectController");

// POST /api/tasks  - only that project's admin can create tasks
const createTask = async (req, res) => {
  try {
    const { title, description, project: projectId, sprint, assignee, priority, storyPoints } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can create tasks" });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      sprint: sprint || null,
      assignee: assignee || null,
      priority,
      storyPoints,
    });
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/project/:projectId  -> all tasks for a project (backlog + all sprints)
const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate("assignee", "name email")
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/tasks/:id  - the project's admin can edit anything; any member
// of the project can still update the task's own status/assignment
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    const isManager = canManageProject(req.user, project);
    const isMember = project.members.some((m) => String(m) === String(req.user._id));

    if (!isManager && !isMember) {
      return res.status(403).json({ message: "You don't have access to this project" });
    }

    const { title, description, sprint, assignee, status, priority, storyPoints } = req.body;

    if (isManager) {
      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (sprint !== undefined) task.sprint = sprint;
      if (assignee !== undefined) task.assignee = assignee;
      if (priority !== undefined) task.priority = priority;
      if (storyPoints !== undefined) task.storyPoints = storyPoints;
    }
    // Anyone with project access can move a task's status (e.g. todo -> done)
    if (status !== undefined) task.status = status;

    await task.save();
    await task.populate("assignee", "name email");
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const project = await Project.findById(task.project);
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can delete tasks" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/tasks/generate-description  -> AI helper while creating a task
const generateDescription = async (req, res) => {
  try {
    const { title, projectContext } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const description = await generateTaskDescription(title, projectContext);
    res.json({ description });
  } catch (err) {
    res.status(500).json({ message: `AI generation failed: ${err.message}` });
  }
};

// GET /api/tasks/project/:projectId/recommendation -> AI workload recommendation
const getProductivityRecommendation = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can request this" });
    }

    const tasks = await Task.find({ project: req.params.projectId }).populate("assignee", "name");

    const workloadMap = {};
    tasks.forEach((t) => {
      const name = t.assignee ? t.assignee.name : "Unassigned";
      workloadMap[name] = (workloadMap[name] || 0) + t.storyPoints;
    });

    const workloadSummary = Object.entries(workloadMap)
      .map(([name, points]) => `${name}: ${points} story points`)
      .join("\n");

    const recommendation = await generateProductivityRecommendation(workloadSummary || "No tasks yet");
    res.json({ recommendation });
  } catch (err) {
    res.status(500).json({ message: `AI recommendation failed: ${err.message}` });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  generateDescription,
  getProductivityRecommendation,
};
