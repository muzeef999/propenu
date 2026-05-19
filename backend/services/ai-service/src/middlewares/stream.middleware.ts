import { Request, Response } from "express";

export function streamMiddleware(
  req :Request,
  res :Response,
  next :Function
) {

  res.setHeader(
    "Content-Type",
    "application/x-ndjson"
  );

  res.setHeader(
    "Transfer-Encoding",
    "chunked"
  );

  next();
}