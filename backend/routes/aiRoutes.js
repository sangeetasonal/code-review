import express from "express";
import { getReview } from "../controllers/aiControllers.js";
import { runCode } from "../controllers/runController.js";

const router = express.Router();

router.post("/get-review", getReview);
router.post("/run-code", runCode);

export default router;
