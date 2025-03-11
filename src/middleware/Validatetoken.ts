import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend Request interface to include userInfo
// Extend Request interface to include user information
interface AuthenticatedRequest extends Request {
  userData?: {
    id: string;
    name: string;
    email: string;
    address: string;
    role: string;
    city: string;
    phone: string;
    altPhone?: string;
    avatar?: string;
  };
}

const validateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized - No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as { userInfo: any };

    req.userData = decoded.userInfo; // ✅ Attach user info to request

    console.log("User Info Extracted:", req.userData);

    next(); // ✅ Pass control to next middleware
  } catch (error) {
    res.status(403).json({ message: "Forbidden - Invalid token" });
  }
};

export default validateToken;
export { AuthenticatedRequest }; // ✅ Export the CustomRequest type for reuse
