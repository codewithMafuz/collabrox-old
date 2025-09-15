import jwt from 'jsonwebtoken';
import User from 'models/user.js';
import { Types } from 'mongoose';
import { JWT_SECRET_TOKEN } from 'constants/envVars.js';

interface JwtPayload {
    userId: string;
    username?: string;
    iat: number;
    exp: number;
    [key: string]: any; // Might get additional properties
}

/**
 * Generates an token for a user.
 * @param payload - The payload to sign.
 * @param expiresIn - (default: 15M) The expiration time for the token
 * @returns The generated access token.
 */

const generateToken = (payload: Record<string, any>, expiresIn: string = '15M'): string => {
    try {
        return jwt.sign(
            payload,
            JWT_SECRET_TOKEN,
            { expiresIn } as jwt.SignOptions
        );
    } catch (error) {
        console.error('Error generating token:', error);
        throw new Error('Could not generate token');
    }
};

/**
 * Verifies a token.
 * @param token - The token to verify.
 * @returns The decoded payload if valid, otherwise null.
 */
const verifyToken = (token: string): JwtPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET_TOKEN) as JwtPayload;
    } catch (error) {
        console.error('Error verifying access token:', error);
        return null;
    }
};

/**
 * Verifies a refresh token against the stored token.
 * @param token - The refresh token to verify.
 * @returns The decoded payload if valid and matches stored token, otherwise null.
 */
const verifyRefreshToken = async (token: string): Promise<JwtPayload | null> => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET_TOKEN) as JwtPayload;
        if (!decoded) return null; // Token is not valid

        // Checking if the token exists in the user document
        const exists = await User.exists({ _id: decoded.userId!, refreshTokens: token });
        if (!exists) {
            console.log(`Refresh token verification failed: Token not found or doesn't match for user ${decoded.userId}`);
            return null;
        }

        return decoded;
    } catch (error: any) {
        console.error('Error verifying refresh token:', error.name, error.message);
        return null;
    }
};

/**
 * Invalidates the refresh token for a user (e.g., on logout).
 * @param userId - The ID of the user.
 */
const invalidateRefreshToken = async (userId: string | Types.ObjectId, token?: string): Promise<void> => {
    try {
        // Ensure userId is a valid ObjectId
        if (typeof userId === 'string') {
            userId = new Types.ObjectId(userId);
        }
        // Remove the specific token from the refreshTokens array
        if (token) {
            await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: token } });
        }
    } catch (error) {
        console.error(`Error invalidating refresh token for user ${userId}:`, error);
    }
};

export {
    generateToken,
    verifyToken,
    verifyRefreshToken,
    invalidateRefreshToken,
};