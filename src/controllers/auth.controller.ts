import { Request, Response } from "express";
import { registerUser, loginUser, logoutUser } from "../services/auth.service";
import { generateToken } from "../utils/jwt";
import { extractTokenFromRequest } from "../utils/auth-token";
import { AuthenticatedRequest } from "../types/auth-request";

const handleAuthError = (res: Response, error: unknown) => {
  const message = error instanceof Error ? error.message : "Something went wrong";
  const statusCode =
    message === "Invalid email or password" ? 401 :
    message === "Unauthorized access, token is missing" ? 401 :
    400;

  return res.status(statusCode).json({ success: false, error: message });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const user = await registerUser(name, email, password);
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    handleAuthError(res, error);
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    await logoutUser({
      token: extractTokenFromRequest(req),
      userId: req.user?.id,
    });

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    handleAuthError(res, error);
  }
};
