import { Request, Response, NextFunction } from 'express';
import sendTemplate from "../lib/templateHelpers.js";

export const generatePassword = (length: number): string => {
    if (length < 8) {
        throw new Error("Password length must be at least 8");
    }

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const allChars = 'abcdefghijklmnopqrstuvwxyz' + uppercase + digits;

    const passwordArray: string[] = new Array(length);
    const usedPositions = new Set<number>();
    const randomIndex = (limit: number) => Math.floor(Math.random() * limit);

    // Place 2 digits randomly
    for (let i = 0; i < 2; i++) {
        let pos: number;
        do {
            pos = randomIndex(length);
        } while (usedPositions.has(pos));
        passwordArray[pos] = digits[randomIndex(digits.length)];
        usedPositions.add(pos);
    }

    // Place 2 uppercase letters randomly
    for (let i = 0; i < 2; i++) {
        let pos: number;
        do {
            pos = randomIndex(length);
        } while (usedPositions.has(pos));
        passwordArray[pos] = uppercase[randomIndex(uppercase.length)];
        usedPositions.add(pos);
    }

    // Fill remaining positions
    for (let i = 0; i < length; i++) {
        if (passwordArray[i]) continue; // Already filled

        let char: string;
        do {
            char = allChars[randomIndex(allChars.length)];
        } while (i > 0 && passwordArray[i - 1] === char); // No repeat with previous

        passwordArray[i] = char;
    }

    return passwordArray.join('');
}


export const checkUserRole = (requiredRole: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).send(sendTemplate(false, 'Authentication required'));
        }
        if (req.user.role !== requiredRole) {
            return res.status(403).send(sendTemplate(false, `Forbidden: Requires ${requiredRole} role`));
        }
        next();
    };
};

/** 
 * Filters out timestamps older than the specified max age in milliseconds.
 */
export const pruneOldTimestamps = (timestamps: number[], maxAgeMs: number = 1000 * 60 * 60 * 12) => {
    const now = Date.now();
    return timestamps.filter(t => now - t < maxAgeMs);
}