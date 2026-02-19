import mongoose, { Schema } from "mongoose";

const userSchema = new Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minLength: 8,
    },
    firstName: {
        type: String,
        required: false,
        trim: true,
    },
    middleInitial: {
        type: String,
        required: false,
    },
    lastName: {
        type: String,
        required: false,
        trim: true,
    },
});

export default mongoose.model("User", userSchema);