// Side-effect import: keeps this file a module so `declare global` is legal.
// The Express typings are only needed for the ambient namespace merge below.
import "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
