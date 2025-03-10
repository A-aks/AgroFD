import { Request, Response, NextFunction } from "express";

// Extend Request type to include user
interface CustomRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware function to check role permissions
const checkRole = (allowedRoles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Access Denied: Unauthorized Role" });
      return; // Ensure function execution stops
    }
    next();
  };
};

export default checkRole;
