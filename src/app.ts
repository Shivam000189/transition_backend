import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import accountRoutes from "./routes/account.routes";
import transactionRoutes from "./routes/transaction.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());

// Use auth routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transactions", transactionRoutes);




app.get("/", (_req, res) => {
  res.send("API running...");
});

//health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});


export default app;
