import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware to verify JWT token
const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from "Bearer <TOKEN>"

  if (!token) {
    res.status(401).json({ message: "Unauthorized: No Token Provided" });
    return; // Stop further execution
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { id: string; role: string };
    req.user = decoded; // Attach user info to request
    next();
  } catch (error) {
    res.status(403).json({ message: "Unauthorized: Invalid Token" });
  }
};
export default authMiddleware;
