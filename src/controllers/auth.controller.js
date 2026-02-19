import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // Used for creating JWT tokens
import User from "../models/user.model.js";
import dotenv from "dotenv";

dotenv.config();

// Login controller
export const login = async (req, res) => {
  try {
    // Check if email and password are provided
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create a JWT token (you can modify this according to your requirements)
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Token expires in 1 hour
    );

    // Return the token and user information (you can customize this response)
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        email: user.email,
        firstName: user.firstName,
        middleInitial: user.middleInitial,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

