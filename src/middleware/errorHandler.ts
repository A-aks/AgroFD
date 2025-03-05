import { Request, Response, NextFunction } from "express";
import { constants } from "../constant"; // Ensure this is correctly exported in constant.ts

interface CustomError extends Error {
  statusCode?: number;
  stack?: string;
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = res.statusCode || 500;

  let errorResponse = {
    title: "Error",
    message: err.message || "Something went wrong",
    stackTrace: process.env.NODE_ENV === "development" ? err.stack : undefined, // Hide stack trace in production
  };

  switch (statusCode) {
    case constants.NOT_FOUND:
      errorResponse.title = "Not Found";
      break;
    case constants.UNAUTHORIZED:
      errorResponse.title = "Unauthorized";
      break;
    case constants.VALIDATION_ERROR:
      errorResponse.title = "Validation Failed";
      break;
    case constants.FORBIDDEN:
      errorResponse.title = "Forbidden";
      break;
    case constants.SERVER_ERROR:
      errorResponse.title = "Server Error";
      break;
    case constants.CREATED:
      errorResponse.title = "Created!";
      break;
    case constants.OK:
      errorResponse.title = "Ok";
      break;
    default:
      console.log("No specific error, all good!");
      break;
  }

  res.status(statusCode).json(errorResponse);
};

export default errorHandler;
