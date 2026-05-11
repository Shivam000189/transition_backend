import { Request } from "express";

export type AuthenticatedUser = {
  id: number;
  email: string;
  name: string;
  systemUser: boolean;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};
