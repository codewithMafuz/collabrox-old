import { Request, Response, NextFunction } from 'express';
import { NODE_ENV } from '../constants/envVars.js';
import User from '../models/user.js';
import sendTemplate from '../lib/templateHelpers.js';
import { generateToken, verifyToken, verifyRefreshToken } from '../lib/tokenHelpers.js';
import { IUser } from '../models/user.js';
import { DecodedToken } from '@app-types/token.js';
import { AUTH_ACCESS_TOKEN_EXPIRES_IN } from 'controllers/UserController.js';
import { toMS } from 'lib/numberHelpers.js';


const cookieOptions = {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax' as const // for dev server
    // sameSite: 'none' as const // for production
};

const clearAuthCookies = (res: Response) => {
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
};

const getUserById = async (userId: string) => {
    // Select all fields needed for downstream (role, email, etc)
    return User.findById(userId)
        .select('_id username personId closedNow role email name profileSrc')
        .lean();
};

/**
 * Middleware to verify user authentication via access and refresh tokens.
 *
 * Logic:
 * 1. If `req.optionalAuth` is set and no tokens, skip auth (used for optional user context).
 * 2. Try verifying the access token.
 *    - If valid, check user status and proceed.
 *    - If invalid, proceed to refresh token.
 * 3. If refresh token exists and valid:
 *    - Check user status and issue a new access token.
 *    - Attach user to `req.user`.
 * 4. If all fails, clear tokens and return 401 unauthorized.
 */
export default async function checkAuth(req: Request, res: Response, next: NextFunction) {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    // console.log({accessToken, refreshToken}) // for debug

    // Allow route to continue if authentication is optional and no tokens provided
    if (req.optionalAuth === true && !accessToken && !refreshToken) return next();

    // === Verify Access Token (Short time token) ===
    if (accessToken) {
        const decAccessToken = verifyToken(accessToken) as DecodedToken | null;
        if (decAccessToken?.userId) {
            try {
                const user = await getUserById(decAccessToken.userId);

                if (!user || user.closedNow) {
                    console.warn(`Access token user invalid: ${decAccessToken.userId}`);
                    clearAuthCookies(res);
                    return res.status(401).send(sendTemplate(false, 'User not found or inactive.'));
                }

                // Attach user to request and proceed
                req.user = user as IUser;
                return next();
            } catch (error) {
                console.error('Error fetching user during access token check:', error);
                return res.status(500).send(sendTemplate(false, 'Internal error during authentication.'));
            }
        }

        // If token is invalid, fall back to refresh token
        console.log('Access token invalid or expired. Going forward to check refresh token...');
    }

    // ===  Handle Missing Refresh Token ===
    if (!refreshToken) {
        console.warn('Missing both access and refresh tokens.');
        return res.status(401).send(sendTemplate(false, 'Unauthorized. No token provided.'));
    }

    // === Verify Refresh Token (Long time token) ===
    try {
        const decRefreshToken = await verifyRefreshToken(refreshToken) as DecodedToken | null;

        if (!decRefreshToken?.userId) {
            console.warn('Refresh token payload invalid.');
            clearAuthCookies(res);
            return res.status(401).send(sendTemplate(false, 'Invalid refresh token. Please log in again.'));
        }

        const user = await getUserById(decRefreshToken.userId);

        if (!user || user.closedNow) {
            console.warn(`Refresh token user invalid: ${decRefreshToken.userId}`);
            clearAuthCookies(res);
            return res.status(401).send(sendTemplate(false, 'Invalid refresh token user.'));
        }

        // Generate and set new access token
        const newAccessToken = generateToken(
            { userId: user._id!.toString(), username: user.username },
            AUTH_ACCESS_TOKEN_EXPIRES_IN
        );

        res.cookie('accessToken', newAccessToken, {
            ...cookieOptions,
            maxAge: toMS(AUTH_ACCESS_TOKEN_EXPIRES_IN)
        });

        req.user = user as IUser;
        return next();
    } catch (error) {
        console.error('Error verifying refresh token:', error);
        clearAuthCookies(res);
        return res.status(401).send(sendTemplate(false, 'Unauthorized. Internal Server Error during token refresh.'));
    }
}
