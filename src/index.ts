import express, { Request, Response } from "express";
import dotenv from "dotenv";
import prisma from "./db/db.config";

const app = express();
const PORT = 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Hello from TypeScript backend!");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
