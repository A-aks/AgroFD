import { Response, NextFunction, RequestHandler } from "express";
import { CustomRequest } from "../types/CustomRequest";

const checkRole = (allowedRoles: string[]): RequestHandler => {
  return (req, res, next) => {
    const customReq = req as CustomRequest; // Explicitly cast `req`
    //console.log("Checking role for user:", customReq.user); // Debugging log
    const userRole = customReq.user?.userInfo?.role; // ✅ Safely access role

    console.log("User Role:", userRole); // ✅ Log the actual role
    if (!customReq.user) {
      res.status(401).json({ message: "Unauthorized: No user found" });
      return;
    }
    if (!customReq.user.userInfo || !allowedRoles.includes(customReq.user.userInfo.role)) {
      res.status(403).json({ message: `Access Denied: Role '${customReq.user.userInfo?.role || "undefined"}' not allowed` });
      return;
    }

    return next();
  };
};

export default checkRole;
