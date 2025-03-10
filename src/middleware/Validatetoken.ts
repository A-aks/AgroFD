import asyncHandler from "express-async-handler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

interface AuthRequest extends Request {
  userInfo?: JwtPayload;
}

const validateToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || (typeof authHeader === "string" && !authHeader.startsWith("Bearer "))) {
    res.status(401);
    throw new Error("Unauthorized: Missing or invalid token");
  }
console.log(req.headers.Authorization);

  const token = (typeof authHeader === "string" ? authHeader : authHeader[0]).split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;
    authReq.userInfo = decoded; // Attach decoded user info to request object
    next();
  } catch (error) {
    res.status(403);
    throw new Error("Forbidden: Invalid or expired token");
  }
});

export default validateToken;
