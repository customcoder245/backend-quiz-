import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js"
import questionRoutes from "./routes/question.routes.js"

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working 🚀"
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/questions", questionRoutes);

export { app };