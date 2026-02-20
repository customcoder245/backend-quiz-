import express from "express";
import {
    getAllQuestions,
    getQuestionById,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    saveUserResponses,
    getUserResponses,
    deleteUserResponses,
} from "../controllers/question.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ─── QUESTION CRUD ───────────────────────────────────────────
router.get("/", getAllQuestions);            // GET /api/v1/questions (Public)
router.get("/:id", getQuestionById);        // GET /api/v1/questions/:id (Public)
router.post("/", protect, createQuestion);           // POST /api/v1/questions
router.put("/:id", protect, updateQuestion);         // PUT /api/v1/questions/:id
router.delete("/:id", protect, deleteQuestion);      // DELETE /api/v1/questions/:id

// ─── USER RESPONSES (protected) ──────────────────────
router.post("/responses/save", protect, saveUserResponses);    // POST /api/v1/questions/responses/save
router.get("/responses/me", protect, getUserResponses);        // GET /api/v1/questions/responses/me
router.delete("/responses/me", protect, deleteUserResponses);  // DELETE /api/v1/questions/responses/me

export default router;
