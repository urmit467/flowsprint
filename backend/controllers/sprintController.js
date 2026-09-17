const Sprint = require("../models/Sprint");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { generateSprintSummary } = require("../services/llmService");
const { canManageProject } = require("./projectController");

// POST /api/sprints  - only that project's admin can create sprints
const createSprint = async (req, res) => {
  try {
    const { name, project: projectId, goal, startDate, endDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can create sprints" });
    }

    const sprint = await Sprint.create({ name, project: projectId, goal, startDate, endDate });
    res.status(201).json(sprint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/sprints/project/:projectId
const getSprintsByProject = async (req, res) => {
  try {
    const sprints = await Sprint.find({ project: req.params.projectId }).sort({ startDate: 1 });
    res.json(sprints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/sprints/:id
const updateSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    const project = await Project.findById(sprint.project);
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can update sprints" });
    }

    const { name, goal, startDate, endDate, status } = req.body;
    if (name !== undefined) sprint.name = name;
    if (goal !== undefined) sprint.goal = goal;
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;
    if (status !== undefined) sprint.status = status;

    await sprint.save();
    res.json(sprint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/sprints/:id
const deleteSprint = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    const project = await Project.findById(sprint.project);
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can delete sprints" });
    }

    await sprint.deleteOne();
    // Unassign tasks back to backlog rather than deleting them
    await Task.updateMany({ sprint: sprint._id }, { $set: { sprint: null } });
    res.json({ message: "Sprint deleted, tasks moved back to backlog" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/sprints/:id/summary  -> AI-generated sprint summary
const generateSummary = async (req, res) => {
  try {
    const sprint = await Sprint.findById(req.params.id);
    if (!sprint) return res.status(404).json({ message: "Sprint not found" });

    const project = await Project.findById(sprint.project);
    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can generate a summary" });
    }

    const tasks = await Task.find({ sprint: sprint._id });
    const summary = await generateSprintSummary(sprint.name, tasks);

    sprint.aiSummary = summary;
    await sprint.save();

    res.json({ aiSummary: summary });
  } catch (err) {
    res.status(500).json({ message: `AI summary failed: ${err.message}` });
  }
};

module.exports = { createSprint, getSprintsByProject, updateSprint, deleteSprint, generateSummary };
