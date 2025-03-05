import asyncHandler from "express-async-handler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthRequest extends Request {
  userInfo?: JwtPayload | string;
  headers: {
    authorization?: string;
    Authorization?: string;
  };
} 

const validateToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthRequest;
  const authHeader: string | undefined = authReq.headers.authorization || authReq.headers.Authorization as string;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401);
      throw new Error("User not authorized or token is missing");
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, decoded) => {
      if (err) {
        res.status(401);
        throw new Error("User not Authorized!");
      }

      authReq.userInfo = decoded; // Attach decoded user info to request object
      (req as AuthRequest).userInfo = decoded; // Attach decoded user info to request object
      next();
    });
  } else {
    res.status(401);
    throw new Error("Authorization header missing or invalid");
  }
});

export default validateToken;
