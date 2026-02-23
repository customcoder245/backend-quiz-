import Question from "../models/question.model.js";
import UserResponse from "../models/userResponse.model.js";
import User from "../models/user.model.js";

// ─── QUESTION CRUD ───────────────────────────────────────────

// GET all questions (optionally filter by gender)
export const getAllQuestions = async (req, res) => {
    try {
        const { gender, includeInactive } = req.query;
        const filter = includeInactive === 'true' ? {} : { isActive: true };

        if (gender && gender !== 'all' && gender !== 'both') {
            filter.$or = [{ gender: "both" }, { gender }];
        }
        const questions = await Question.find(filter).sort({ order: 1 });
        return res.status(200).json({ questions });
    } catch (error) {
        console.error("Error in getAllQuestions:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET single question by ID
export const getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: "Question not found" });
        return res.status(200).json({ question });
    } catch (error) {
        console.error("Error in getQuestionById:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// POST create new question
export const createQuestion = async (req, res) => {
    try {
        const question = await Question.create(req.body);
        return res.status(201).json({ message: "Question created", question });
    } catch (error) {
        console.error("Error in createQuestion:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// PUT update question by ID
export const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: "Question not found" });

        question.set(req.body);
        await question.save();

        return res.status(200).json({ message: "Question updated", question });
    } catch (error) {
        console.error("Error in updateQuestion:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// DELETE question by ID
export const deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);
        if (!question) return res.status(404).json({ message: "Question not found" });
        return res.status(200).json({ message: "Question deleted" });
    } catch (error) {
        console.error("Error in deleteQuestion:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── USER RESPONSE ───────────────────────────────────────────

// POST save or update user's quiz responses
export const saveUserResponses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { responses, completed, gender } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(403).json({
                message: "Admins cannot participate in the assessment. Please use the dashboard."
            });
        }

        if (gender) {
            user.gender = gender;
            await user.save();
        }

        let userResponse = await UserResponse.findOne({ userId });
        if (!userResponse) {
            userResponse = new UserResponse({ userId });
        }

        userResponse.responses = responses;
        userResponse.completedAt = completed ? new Date() : null;
        await userResponse.save();

        return res.status(200).json({ message: "Responses saved", userResponse });
    } catch (error) {
        console.error("Error in saveUserResponses:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET logged-in user's responses
export const getUserResponses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const userResponse = await UserResponse.findOne({ userId }).populate(
            "responses.questionId"
        );
        if (!userResponse)
            return res.status(404).json({ message: "No responses found for this user" });
        return res.status(200).json({ userResponse });
    } catch (error) {
        console.error("Error in getUserResponses:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// POST public submission of assessment
export const submitAssessment = async (req, res) => {
    try {
        const { email, firstName, responses, gender } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                email,
                firstName: firstName || "Guest",
                gender: gender || "both",
                password: Math.random().toString(36).slice(-8) + "!",
                role: "user"
            });
        }

        let userResponse = await UserResponse.findOne({ userId: user._id });
        if (!userResponse) {
            userResponse = new UserResponse({ userId: user._id });
        }

        userResponse.responses = responses;
        userResponse.completedAt = new Date();
        await userResponse.save();

        return res.status(200).json({ message: "Assessment submitted", userResponse });
    } catch (error) {
        console.error("Error in submitAssessment:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET all assessment submissions (Admin only)
export const getAllSubmissions = async (req, res) => {
    try {
        const submissions = await UserResponse.find()
            .populate("userId", "firstName email gender")
            .populate("responses.questionId", "questionText")
            .sort({ createdAt: -1 });

        const formattedSubmissions = submissions.map((sub) => ({
            id: sub._id,
            name: sub.userId?.firstName || "Guest",
            email: sub.userId?.email || "N/A",
            gender: sub.userId?.gender || "N/A",
            date: sub.completedAt ? new Date(sub.completedAt).toLocaleDateString() : "In Progress",
            questions: sub.responses.map(r => r.questionId?.questionText).filter(Boolean).slice(0, 2).join(", ") + "...",
            selectedOptions: sub.responses.map(r => Array.isArray(r.answer) ? r.answer.join(", ") : r.answer).slice(0, 2).join(" | ") + "...",
        }));

        return res.status(200).json({ submissions: formattedSubmissions });
    } catch (error) {
        console.error("Error in getAllSubmissions:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// DELETE user's responses (reset quiz)
export const deleteUserResponses = async (req, res) => {
    try {
        const userId = req.user.userId;
        await UserResponse.findOneAndDelete({ userId });
        return res.status(200).json({ message: "Quiz responses reset successfully" });
    } catch (error) {
        console.error("Error in deleteUserResponses:", error);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
