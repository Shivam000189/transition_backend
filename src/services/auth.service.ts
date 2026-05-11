import prisma from "../db/db.config";
import { comparePassword, hashPassword } from "../utils/hash";
import { addTokenToBlacklist, extractTokenFromRequest } from "../utils/auth-token";
import { sendRegistrationEmail } from "./email.service";



export const registerUser = async (name:string, email: string, password: string) => {
  const userExists = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (userExists) {
    throw new Error("User already exists");
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  await sendRegistrationEmail(user.email, user.name);

  return user;
};

export const loginUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  return user;
};

type LogoutUserInput = {
  token: string | null;
  userId?: number;
};

export const logoutUser = async ({ token, userId }: LogoutUserInput) => {
  if (!token) {
    throw new Error("Unauthorized access, token is missing");
  }

  if (!userId) {
    throw new Error("Unauthorized access, token is invalid");
  }

  await addTokenToBlacklist(token, userId);
};
