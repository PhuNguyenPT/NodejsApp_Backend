import { Request, Response } from "express";

import HttpException from "@/type/exception/http.exception.js";

function errorMiddleware(error: Error, _req: Request, res: Response): void {
  let status: number;
  let message: string;

  if (error instanceof HttpException) {
    status = Number(error.status) || 500;
    message = String(error.message) || "Something went wrong";
  } else {
    // It's a generic Error or other type
    status = 500;
    message = error.message || "Something went wrong";
  }

  res.status(status).send({
    message,
    status,
  });
}

export default errorMiddleware;
