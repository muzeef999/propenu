import "express";

declare global {
  namespace Express {
    interface Request {
      memory?: {
        budget?: string;
        city?: string;
        propertyType?: string;
        bhk?: string;
        location?: string;
        [key: string]: any;
      };
    }
  }
}

export {};