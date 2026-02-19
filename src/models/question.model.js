import mongoose, { Schema } from "mongoose";

const optionSchema = new Schema(
    {
        text: { type: String, required: true },
        emoji: { type: String, default: "" },
    },
    { _id: false }
);

const questionSchema = new Schema(
    {
        order: {
            type: Number,
            required: true,
            unique: true,
        },
        questionText: {
            type: String,
            required: true,
        },
        // single-select | multi-select | text-input | number-input
        type: {
            type: String,
            enum: ["single-select", "multi-select", "text-input", "number-input"],
            required: true,
        },
        // 'both' | 'male' | 'female' — for gender-specific questions
        gender: {
            type: String,
            enum: ["both", "male", "female"],
            default: "both",
        },
        options: {
            type: [optionSchema],
            default: [],
        },
        // true = popup question shown during analysis
        isPopup: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
