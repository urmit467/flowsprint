const express = require("express");
const router = express.Router();
const {
  createSprint,
  getSprintsByProject,
  updateSprint,
  deleteSprint,
  generateSummary,
} = require("../controllers/sprintController");
const protect = require("../middleware/auth");

router.use(protect);

router.get("/project/:projectId", getSprintsByProject);
router.post("/", createSprint); // ownership checked inside the controller
router.put("/:id", updateSprint); // ownership checked inside the controller
router.delete("/:id", deleteSprint); // ownership checked inside the controller
router.post("/:id/summary", generateSummary); // ownership checked inside the controller

module.exports = router;
