const Project = require("../models/Project");
const User = require("../models/User");


const canManageProject = (user, project) =>
  String(project.manager) === String(user._id) || user.role === "admin";


const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      manager: req.user._id,
      members: [],
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects - projects the user created or was added to
const getProjects = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { $or: [{ manager: req.user._id }, { members: req.user._id }] };

    const projects = await Project.find(filter)
      .populate("manager", "name email specialId")
      .populate("members", "name email specialId")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("manager", "name email specialId")
      .populate("members", "name email specialId");

    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/projects/:id  - only the project's own admin (creator) or a global admin
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can update it" });
    }

    const { name, description, status } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id  - only the project's own admin (creator) or a global admin
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can delete it" });
    }

    await project.deleteOne();
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects/:id/members  { specialId }  - add a user to the
// project by their special ID (e.g. "FS-7K2P9X"). Only that project's
// admin can add people.
const addMemberBySpecialId = async (req, res) => {
  try {
    const { specialId } = req.body;
    if (!specialId) return res.status(400).json({ message: "specialId is required" });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can add members" });
    }

    const userToAdd = await User.findOne({ specialId: specialId.trim().toUpperCase() });
    if (!userToAdd) return res.status(404).json({ message: "No user found with that special ID" });

    if (String(userToAdd._id) === String(project.manager)) {
      return res.status(400).json({ message: "That user already owns this project" });
    }
    if (project.members.some((m) => String(m) === String(userToAdd._id))) {
      return res.status(400).json({ message: "That user is already a member" });
    }

    project.members.push(userToAdd._id);
    await project.save();

    const updated = await Project.findById(project._id)
      .populate("manager", "name email specialId")
      .populate("members", "name email specialId");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id/members/:userId  - remove a member (project admin only)
const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });

    if (!canManageProject(req.user, project)) {
      return res.status(403).json({ message: "Only this project's admin can remove members" });
    }

    project.members = project.members.filter((m) => String(m) !== String(req.params.userId));
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberBySpecialId,
  removeMember,
  canManageProject,
};
