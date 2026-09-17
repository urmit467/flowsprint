const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasksByProject,
  updateTask,
  deleteTask,
  generateDescription,
  getProductivityRecommendation,
} = require("../controllers/taskController");
const protect = require("../middleware/auth");

router.use(protect);

router.get("/project/:projectId", getTasksByProject);
router.get("/project/:projectId/recommendation", getProductivityRecommendation); // ownership checked inside
router.post("/generate-description", generateDescription);
router.post("/", createTask); // ownership checked inside the controller
router.put("/:id", updateTask); // manager vs. member fields checked inside
router.delete("/:id", deleteTask); // ownership checked inside the controller

module.exports = router;
