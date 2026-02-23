import Question from "../models/question.model.js";
import UserResponse from "../models/userResponse.model.js";
import User from "../models/user.model.js";

// ─── QUESTION CRUD ───────────────────────────────────────────

// GET all questions (optionally filter by gender)
export const getAllQuestions = async (req, res) => {
    try {
        const { gender, includeInactive } = req.query;
        // If includeInactive is true, show all. Otherwise only active.
        const filter = includeInactive === 'true' ? {} : { isActive: true };

        if (gender && gender !== 'all' && gender !== 'both') {
            filter.$or = [{ gender: "both" }, { gender }];
        }
        const questions = await Question.find(filter).sort({ order: 1 });
        return res.status(200).json({ questions });
    } catch (error) {
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
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// POST create new question
export const createQuestion = async (req, res) => {
    try {
        const question = await Question.create(req.body);
        return res.status(201).json({ message: "Question created", question });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// PUT update question by ID
export const updateQuestion = async (req, res) => {
    try {
        const question = await Question.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!question) return res.status(404).json({ message: "Question not found" });
        return res.status(200).json({ message: "Question updated", question });
    } catch (error) {
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
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ─── USER RESPONSE ───────────────────────────────────────────

// POST save or update user's quiz responses
export const saveUserResponses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { responses, completed, gender } = req.body;

        // Fetch user to check role and update gender
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // ADMIN CHECK: Admins cannot take the quiz
        if (user.role === "admin") {
            return res.status(403).json({
                message: "Admins cannot participate in the assessment. Please use the dashboard."
            });
        }

        // If gender is provided, update it
        if (gender) {
            user.gender = gender;
            await user.save();
        }

        const userResponse = await UserResponse.findOneAndUpdate(
            { userId },
            {
                userId,
                responses,
                completedAt: completed ? new Date() : null,
            },
            { upsert: true, new: true, runValidators: true }
        );

        return res.status(200).json({ message: "Responses saved", userResponse });
    } catch (error) {
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

        // Find or create user internally (since we removed explicit register)
        let user = await User.findOne({ email });

        if (!user) {
            user = await User.create({
                email,
                firstName: firstName || "Guest",
                gender: gender || "both",
                password: Math.random().toString(36).slice(-8) + "!", // Random temp password
                role: "user"
            });
        }

        const userResponse = await UserResponse.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                responses,
                completedAt: new Date(),
            },
            { upsert: true, new: true, runValidators: true }
        );

        return res.status(200).json({ message: "Assessment submitted", userResponse });
    } catch (error) {
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
            // For simplicity in the table, we'll join the first few responses
            questions: sub.responses.map(r => r.questionId?.questionText).filter(Boolean).slice(0, 2).join(", ") + "...",
            selectedOptions: sub.responses.map(r => Array.isArray(r.answer) ? r.answer.join(", ") : r.answer).slice(0, 2).join(" | ") + "...",
        }));

        return res.status(200).json({ submissions: formattedSubmissions });
    } catch (error) {
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
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};
