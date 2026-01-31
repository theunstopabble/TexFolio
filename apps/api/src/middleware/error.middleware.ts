import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";

interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
  stack?: string;
}

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let details = err.details || null;

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    message = "Validation Error";
    details = Object.values(err.errors).map((e: any) => e.message);
    res.status(400);
  }

  // Handle Mongoose Bad ObjectId
  if (err.name === "CastError") {
    message = "Resource not found";
    res.status(404);
  }

  // Handle Mongoose Duplicate Key
  if (err.code === 11000) {
    message = "Duplicate field value entered";
    res.status(400);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    message = "Validation Error";
    details = err.errors.map((e) => e.message);
    res.status(400);
  }

  // Construct Response
  const response: ErrorResponse = {
    success: false,
    error: message,
    details,
  };

  // Include stack trace in development
  if (env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  // Log error in development or if it's a 500
  if (env.NODE_ENV === "development" || statusCode === 500) {
    console.error(`❌ Error (${req.method} ${req.originalUrl}):`, err);
  }

  res
    .status(
      statusCode === 500 && res.statusCode !== 200
        ? res.statusCode
        : statusCode,
    )
    .json(response);
};
