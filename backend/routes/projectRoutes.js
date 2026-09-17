const express = require("express");
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMemberBySpecialId,
  removeMember,
} = require("../controllers/projectController");
const protect = require("../middleware/auth");

router.use(protect);

router.get("/", getProjects);
router.get("/:id", getProjectById);
router.post("/", createProject); // any logged-in user can create a project
router.put("/:id", updateProject); // ownership checked inside the controller
router.delete("/:id", deleteProject); // ownership checked inside the controller
router.post("/:id/members", addMemberBySpecialId);
router.delete("/:id/members/:userId", removeMember);

module.exports = router;
