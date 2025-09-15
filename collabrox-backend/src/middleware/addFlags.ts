import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Just adds optionalAuth = true in request (Request)
 * @param nextMiddleware The middleware which will be run after that
 * @returns Simply runs the parameter middleware
 */
export default function addOptionalFlag(nextMiddleware: RequestHandler): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
        req.optionalAuth = true;
        nextMiddleware(req, res, next);
    };
};
