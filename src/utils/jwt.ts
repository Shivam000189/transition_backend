import jwt from "jsonwebtoken";


const secretKey = process.env.MY_SECRET_KEY || "my_secret_key";
const tokenExpiry = "24h";

if (!process.env.MY_SECRET_KEY) {
  console.warn(
    "Warning: MY_SECRET_KEY is not set in the environment variables. Using default secret key. This is not recommended for production."
  );
}

export function generateToken(userId: number): string {
  return jwt.sign({ userId }, secretKey, { expiresIn: tokenExpiry });
}

export function verifyToken(token: string): number | null {
  try {
    const decoded = jwt.verify(token, secretKey) as { userId: number };
    return decoded.userId;
  } catch (error) {
    return null;
  }
}

export function decodeTokenExpiry(token: string): Date | null {
  try {
    const decoded = jwt.verify(token, secretKey) as jwt.JwtPayload;
    if (!decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
}




