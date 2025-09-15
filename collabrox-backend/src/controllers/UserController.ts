import { Request, Response } from 'express';
import User, { IUser } from "../models/user.js";
import Person from '../models/person.js';
import sendTemplate, { sendEmailConfirmation } from '../lib/templateHelpers.js';
import Follow from '../models/follow.js';
import AuthTrack from 'models/authTrack.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { checkValidation, isValidEmailAddress, isValidPassword } from '../lib/customValidators.js';
import { AppName } from '../app.js';
import { generateToken, verifyToken } from '../lib/tokenHelpers.js';
import { generateAnUniquePropValue } from '../lib/mongooseHelper.js';
import { FRONTEND_BASE_URL, GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET, GOOGLE_WEB_OAUTH_CLIENT_ID, GOOGLE_WEB_OAUTH_CLIENT_SECRET, NODE_ENV } from '../constants/envVars.js';
import { upperCaseObjectKeys } from 'lib/objectHelpers.js';
import bcrypt from 'bcrypt'
import { generateCloudinaryPath } from 'lib/cloudinaryHelpers.js';
import { uploadProfileImageWithThumb } from 'config/cloudinaryConfig.js';

export const AUTH_ACCESS_TOKEN_EXPIRES_IN = '15M'
export const AUTH_REFRESH_TOKEN_EXPIRES_IN = '30D'

// ==================== Request Body Types or Interfaces ====================
interface SignupReqBody {
    name: string;
    email: string;
    password: string;
    agreeTerms?: boolean;
}
interface VerifySignupParams {
    token: string;
    userId: string;
}
interface LoginReqBody {
    email: string;
    password: string;
}
interface SendResetPasswordReqBody {
    email: string;
}
interface ResetPasswordReqBody {
    password: string;
    confirmPassword: string;
    id: string;
    token: string;
}
interface GoogleSignInReqBody {
    code?: string;
}
interface GithubSignInReqBody {
    code?: string;
}
interface DeleteUserBody {
    input: 'Delete';
}
interface ChangePasswordReqBody {
    password: string;
    confirmPassword: string;
    logout: boolean;
}

// ==================== Cookie Options ====================
const cookieOptions = {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'lax' as const // for dev server
    // sameSite: 'none' as const // for production
};

// ==================== Google OAuth Client Initialization ====================
const client = new OAuth2Client(
    GOOGLE_WEB_OAUTH_CLIENT_ID,
    GOOGLE_WEB_OAUTH_CLIENT_SECRET
);

// ==================== Token Expiration Times (default 15 mins) ====================
const accessTokenExpiresMs = parseInt(AUTH_ACCESS_TOKEN_EXPIRES_IN.replace('m', ''), 10) * 60 * 1000 || 15 * 60 * 1000;

// Refresh token expiration time (default 7 days)
const refreshTokenExpiresMs = parseInt(AUTH_REFRESH_TOKEN_EXPIRES_IN.replace('d', ''), 10) * 24 * 60 * 60 * 1000 || 7 * 24 * 60 * 60 * 1000;

// ============== Allowed User Properties for Response (to hide sensitive information) =========
export const allowedUserProps = ['_id', 'name', 'username', 'email', 'googleId', 'role', 'bio', 'profileSrc', 'personId']

async function convertURLImageToBuffer(imageUrl: string): Promise<Buffer | null> {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;

        return Buffer.from(await response.arrayBuffer())
    } catch (error) {
        return null
    }
}

class UserController {
    static signup = async (req: Request<{}, {}, SignupReqBody>, res: Response) => {
        try {
            // Extract user details from request body
            if (!req.body) {
                return res.status(400).send(sendTemplate(false, "No input body found"))
            }

            const { name, email, password, agreeTerms = true } = (req.body);

            if (!agreeTerms) {
                return res.status(400).send(sendTemplate(false, "Agree terms and condition"))
            }

            // Validating required fields
            if (!name || !email) {
                return res.status(400).send(sendTemplate(false, `Enter valid ${!name ? 'Name' : 'Email'}`));
            }

            if (!password || !isValidPassword(password)) {
                return res.status(400).send(sendTemplate(false, "Password must contain lowercase, uppercase and digit (8, 32) chars"))
            }

            // Validation error check by custom validation checker
            const { errors } = checkValidation({
                fullName: name,
                email,
                password
            })

            // Checking errors
            if (errors) {
                return res.status(400).send(sendTemplate(false, `Enter valid ${Object.keys(upperCaseObjectKeys(errors)).join(', ')}`));
            }

            // Check if a user with the given email already exists
            const foundUser = await User.findOne({
                email: email.trim()
            }, {
                name: 1,
                email: 1,
                closedNow: 1,
                profileSrc: 1,
                isEmailVerified: 1
            });

            // If user have account with email verified, return error
            if (foundUser?.isEmailVerified) {
                return res.status(400).send(sendTemplate(false, "Already have an account with this email"));
            }

            let user = foundUser;
            let userAuthTrack = user ? await AuthTrack.findOne({ userId: user._id }) : null;
            // If user don't have account at all, creating a new account
            if (!user) {
                // Getting ready proposed username
                const proposedUsername = await generateAnUniquePropValue(name.split(' ').join('-'), User, 'username')

                // Creating a new user document
                const newUser = new User({
                    name,
                    email,
                    username: proposedUsername,
                    password,
                });

                userAuthTrack = await new AuthTrack({
                    userId: newUser._id,
                    confMailSentAt: []
                }).save();

                await newUser.save();
                user = newUser;
            } else {
                // If user already have an account, checking confirmation email sent history
                const confMailSentAt = userAuthTrack!.confMailSentAt || []
                const lastSentOne = confMailSentAt[confMailSentAt.length - 1]
                if (confMailSentAt.length >= 5 && lastSentOne + 120_000 > Date.now()) {
                    return res.status(429).send(sendTemplate(false, "Please check email or wait 2/3 minutes to get a new confirmation email"));
                }
                else if (lastSentOne + 20_000 > Date.now()) {
                    return res.status(429).send(sendTemplate(false, "Please check email or wait few seconds to get a new confirmation email"));
                }
            }

            const userId = user!._id!.toString()
            // the email verification link
            const link = `${FRONTEND_BASE_URL}/auth/complete-signup/${userId}/@REPLACE_TOKEN`;

            // Sending the email
            const { isSuccess } = await sendEmailConfirmation({
                email,
                subject: `${AppName} - Email Confirmation to Complete Sign up`,
                userId,
                link,
                linkTitle: 'Complete Sign up',
                nameOrUsername: name,
                reasonToUseLink: `Your email <b>${email}</b> has not been verified yet. Please click the link to verify your email.`,
                fromBrandName: AppName,
                expiresIn: '30M',
            });

            // Responding based on email sending status
            if (isSuccess) {
                userAuthTrack!.confMailSentAt?.push(Date.now())
                await userAuthTrack!.save();

                return res.status(200).send(sendTemplate(true, `Please check and confirm your email to complete signup`, {
                    email
                }));

            } else {
                return res.status(200).send(sendTemplate(true, `Please check existing confirmation email or wait for a new confirmation email`, {
                    email,
                }));
            }

        } catch (error) {
            console.log(error);
            return res.status(500).send(sendTemplate(false, "Something went wrong"));
        }
    };

    static verifySignupConfirmation = async (req: Request<VerifySignupParams>, res: Response) => {
        try {
            const { token, userId } = req.params;
            console.log({ token, userId })

            // Validate userId is a valid ObjectId string
            if (!userId || !/^[a-f\d]{24}$/i.test(userId)) {
                return res.status(400).send(sendTemplate(false, "Invalid or missing userId parameter"));
            }

            const userAuthTrack = await AuthTrack.findOne({ userId }).select('userId').lean().exec();
            if (!userAuthTrack) return res.status(404).send(sendTemplate(false, "Failed to find user, please signup again"));

            const user = await User.findById(userAuthTrack.userId).select('isEmailVerified name email username profileSrc').exec();
            if (!user) return res.status(404).send(sendTemplate(false, "User not found."));

            if (user.isEmailVerified) return res.status(400).send(sendTemplate(false, "Signup already completed, please login"));

            const decoded = verifyToken(token);
            if (!decoded || decoded.userId !== user.id) return res.status(400).send(sendTemplate(false, "Failed to completion signup, try again in signup page"))

            await User.findByIdAndUpdate(decoded.userId, { isEmailVerified: true }, { new: true });
            await AuthTrack.updateOne(
                { userId: decoded.userId },
                { $unset: { confMailSentAt: 1 } },
            )

            // Create Person and Setting after email verification
            // Check if Person and Setting already exist to avoid duplicates
            const personExists = await Person.findOne({ userId: user._id });
            if (!personExists) {
                await Person.create({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                });
            }

            return res.status(200).send(sendTemplate(true, "Email successfully verified and signup completed"));
        } catch (error) {
            console.error("Error verifying signup confirmation:", error);
            return res.status(500).send(sendTemplate(false, "Internal server error"));
        }
    };

    static login = async (req: Request<{}, {}, LoginReqBody>, res: Response) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).send(sendTemplate(false, "Email and password are required."));

            // Validate input format
            const { errors } = checkValidation({ email, password });
            if (errors) return res.status(400).send(sendTemplate(false, "Invalid email or password format"));

            // Find user with password and refresh tokens
            const user = await User.findOne(
                { email },
                { _id: 1, email: 1, username: 1, isEmailVerified: 1, profileSrc: 1, refreshTokens: 1, password: 1, name: 1, profileSrcSm: 1 }
            ).select('+password'); // <-- Explicitly select password

            if (!user) {
                return res.status(401).send(sendTemplate(false, "Invalid credentials"));
            }

            if (!user.isEmailVerified) return res.status(403).send(sendTemplate(false, "Verify your email first"));

            // Verify password
            const isPasswordValid = await bcrypt.compare(password, user.password!);
            console.log({ isPasswordValid })
            if (!isPasswordValid) return res.status(401).send(sendTemplate(false, "Invalid credentials"));

            // Generate new tokens
            const newAccessToken = generateToken(
                { userId: user._id!.toString(), username: user.username },
                AUTH_ACCESS_TOKEN_EXPIRES_IN
            );
            const newRefreshToken = generateToken(
                { userId: user._id!.toString() },
                AUTH_REFRESH_TOKEN_EXPIRES_IN
            )

            // Update refresh tokens array, keeping latest on top
            user.refreshTokens = [newRefreshToken, ...(user.refreshTokens || [])];
            await user.save();

            // Set HTTP-only cookies
            res.cookie('accessToken', newAccessToken, {
                ...cookieOptions,
                maxAge: accessTokenExpiresMs
            });

            res.cookie('refreshToken', newRefreshToken, {
                ...cookieOptions,
                maxAge: refreshTokenExpiresMs
            });

            return res.status(200).send(sendTemplate(true, "Login successful", {
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                profileSrcSm: user.profileSrcSm,
            }));

        } catch (error) {
            console.error("Login error:", error);
            return res.status(500).send(sendTemplate(false, "Internal server error"));
        }
    };

    static googleSignIn = async (req: Request<{}, {}, GoogleSignInReqBody>, res: Response) => {
        try {
            const { code } = req.body;
            if (!code) return res.status(400).send(sendTemplate(false, "Google auth code is required"));

            const { tokens } = await client.getToken({ code, redirect_uri: 'postmessage' });
            const idToken = tokens.id_token;
            if (!idToken) return res.status(400).send(sendTemplate(false, "Failed to get ID token from Google"));

            const ticket = await client.verifyIdToken({
                idToken,
                audience: GOOGLE_WEB_OAUTH_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) return res.status(400).send(sendTemplate(false, "Invalid Google token"));

            // 1. Try to find by Google ID
            let user = await User.findOne({ googleId: payload.sub });
            let isNewUser = false;

            // 2. If not found, try by email
            if (!user && payload.email) {
                user = await User.findOne({ email: payload.email });

                // 3. If found by email, update with Google ID
                if (user) {
                    user.googleId = payload.sub;
                    user.isEmailVerified = true;
                    await user.save();
                }
            }

            // 4. If still not found, create new user
            if (!user) {
                const proposedUsername = await generateAnUniquePropValue(
                    payload.given_name?.replace(/\s+/g, '-') || 'user',
                    User,
                    'username'
                );

                user = new User({
                    googleId: payload.sub,
                    email: payload.email,
                    name: payload.given_name || 'Google User',
                    username: proposedUsername,
                    isEmailVerified: true,
                });
                await user.save();
                isNewUser = true;
            }

            // Ensure Person exists
            let person = await Person.findOne({ userId: user._id });
            if (!person) {
                person = await Person.create({
                    userId: user._id,
                    name: user.name,
                    username: user.username,
                    email: user.email,
                });
            }

            // Profile image handling (only for new users)
            if (isNewUser && payload.picture) {
                const imageBuffer = await convertURLImageToBuffer(payload.picture)
                if (imageBuffer) {
                    const userId = req.user!._id;

                    // Generate unique filename with timestamp
                    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
                    const public_id = generateCloudinaryPath(
                        userId!.toString(),
                        'images',
                        'Person',
                        'Profile',
                        `profile_${timestamp}`
                    );

                    await uploadProfileImageWithThumb(imageBuffer, public_id);
                }
            }

            // Generate tokens
            const newAccessToken = generateToken(
                { userId: user._id!.toString(), username: user.username },
                AUTH_ACCESS_TOKEN_EXPIRES_IN
            );
            const newRefreshToken = generateToken(
                { userId: user._id!.toString() },
                AUTH_REFRESH_TOKEN_EXPIRES_IN
            );

            // Update refresh tokens
            user.refreshTokens = [...(user.refreshTokens || []), newRefreshToken];
            await user.save();

            // Set cookies
            res.cookie('accessToken', newAccessToken, {
                ...cookieOptions,
                maxAge: accessTokenExpiresMs
            });

            res.cookie('refreshToken', newRefreshToken, {
                ...cookieOptions,
                maxAge: refreshTokenExpiresMs
            });

            return res.status(200).send(sendTemplate(true, "Google login successful", {
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                profileSrcSm: user.profileSrcSm,
                isNewUser
            }));

        } catch (error) {
            console.error("Google sign-in error:", error);
            return res.status(500).send(sendTemplate(false, "Google authentication failed"));
        }
    };

    static githubSignIn = async (req: Request<{}, {}, GithubSignInReqBody>, res: Response) => {
        try {
            const { code } = req.body;
            if (!code) return res.status(400).send(sendTemplate(false, "GitHub code required"));

            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    client_id: GITHUB_OAUTH_CLIENT_ID,
                    client_secret: GITHUB_OAUTH_CLIENT_SECRET,
                    code
                })
            });

            const tokenData = await tokenResponse.json();
            if (!tokenData.access_token) {
                return res.status(400).send(sendTemplate(false, "Invalid GitHub code"));
            }

            const githubUserResponse = await fetch('https://api.github.com/user', {
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
            });

            const githubUser = await githubUserResponse.json();
            if (!githubUser?.id) {
                return res.status(400).send(sendTemplate(false, "GitHub user data not found"));
            }

            // Try to get email
            let email = githubUser.email;
            if (!email) {
                const emailsResponse = await fetch('https://api.github.com/user/emails', {
                    headers: { Authorization: `Bearer ${tokenData.access_token}` }
                });
                const emails = await emailsResponse.json();
                if (Array.isArray(emails)) {
                    const primaryEmail = emails.find((e: any) => e.primary && e.verified);
                    email = primaryEmail?.email || emails[0]?.email;
                }
            }

            // 1. Try to find by GitHub ID
            let user = await User.findOne({ githubId: githubUser.id.toString() });
            let isNewUser = false;

            // 2. If not found, try by email
            if (!user && email) {
                user = await User.findOne({ email });

                // 3. If found by email, update with GitHub ID
                if (user) {
                    user.githubId = githubUser.id.toString();
                    user.isEmailVerified = !!email;
                    await user.save();
                }
            }

            // 4. If still not found, create new user
            if (!user) {
                const proposedUsername = await generateAnUniquePropValue(
                    githubUser.login || 'github-user',
                    User,
                    'username'
                );

                user = new User({
                    githubId: githubUser.id.toString(),
                    email: email,
                    name: githubUser.name || githubUser.login || 'GitHub User',
                    username: proposedUsername,
                    isEmailVerified: !!email,
                });
                await user.save();
                isNewUser = true;
            }

            // Ensure Person exists
            let person = await Person.findOne({ userId: user._id });
            if (!person) {
                person = await Person.create({
                    userId: user._id,
                    name: user.name,
                    username: user.username
                });
            }

            // Profile image handling (only for new users)
            if (isNewUser && githubUser.avatar_url) {
                const imageBuffer = await convertURLImageToBuffer(githubUser.avatar_url)
                if (imageBuffer) {
                    const userId = req.user!._id;

                    // Generate unique filename with timestamp
                    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
                    const public_id = generateCloudinaryPath(
                        userId!.toString(),
                        'images',
                        'Person',
                        'Profile',
                        `profile_${timestamp}`
                    );

                    await uploadProfileImageWithThumb(imageBuffer, public_id);
                }
            }

            // Generate tokens
            const newAccessToken = generateToken(
                { userId: user._id!.toString(), username: user.username },
                AUTH_ACCESS_TOKEN_EXPIRES_IN
            );
            const newRefreshToken = generateToken(
                { userId: user._id!.toString() },
                AUTH_REFRESH_TOKEN_EXPIRES_IN
            );

            // Update refresh tokens
            user.refreshTokens = [...(user.refreshTokens || []), newRefreshToken];
            await user.save();

            // Set cookies
            res.cookie('accessToken', newAccessToken, {
                ...cookieOptions,
                maxAge: accessTokenExpiresMs
            });

            res.cookie('refreshToken', newRefreshToken, {
                ...cookieOptions,
                maxAge: refreshTokenExpiresMs
            });

            return res.status(200).send(sendTemplate(true, "GitHub login successful", {
                _id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                profileSrcSm: user.profileSrcSm,
                isNewUser
            }));

        } catch (error) {
            console.error("GitHub sign-in error:", error);
            return res.status(500).send(sendTemplate(false, "GitHub authentication failed"));
        }
    };

    static sendResetPasswordEmailLink = async (req: Request<{}, {}, SendResetPasswordReqBody>, res: Response) => {
        try {
            const { email } = req.body;

            if (!email || !isValidEmailAddress(email)) {
                return res.status(400).send(sendTemplate(false, "Please enter a valid email address to continue."));
            }

            const user = await User.findOne({ email }, { name: 1 }).lean();

            // Don't reveal whether the email exists for security reasons
            if (!user) {
                return res.status(200).send(sendTemplate(true, "If we find an account with that email, we'll send a reset link shortly."));
            }

            const authTrack = await AuthTrack.findOne({ userId: user._id });
            if (!authTrack) {
                return res.status(404).send(sendTemplate(false, "We couldn't process your request at the moment. Please try again in a few minutes."));
            }

            const sentTimestamps = authTrack.resetMailSentAt || [];

            if (sentTimestamps.length >= 5 && sentTimestamps[0] + 180_000 > Date.now()) {
                return res.status(429).send(sendTemplate(false, "You've reached the limit for reset attempts. Please check your email or wait a few minutes before trying again."));
            } else if (sentTimestamps[0] + 20_000 > Date.now()) {
                return res.status(429).send(sendTemplate(false, "Hold on—you're sending requests too quickly. Please wait a few seconds and try again."));
            }

            const { isSuccess } = await sendEmailConfirmation({
                email,
                subject: `${AppName} - Reset Your Password`,
                userId: user._id.toString(),
                link: `${FRONTEND_BASE_URL}/auth/reset-password/${user._id}/@REPLACE_TOKEN`,
                linkTitle: "Reset Password",
                nameOrUsername: user.name,
                reasonToUseLink: `You requested to reset your password for <b>${email}</b>. Click the link below to choose a new password.`,
                fromBrandName: AppName,
                expiresIn: '15M',
                ifUserDidNotRequested: "Didn't request this? No worries—just ignore this email.",
            });

            if (!isSuccess) {
                return res.status(500).send(sendTemplate(false, "Something went wrong while sending the email. Please try again shortly."));
            }

            authTrack.resetMailSentAt = [Date.now(), ...(sentTimestamps.slice(0, 4))]
            await authTrack.save();

            return res.status(200).send(sendTemplate(true, "We've sent a password reset link to your email.", { email }));
        } catch (error) {
            console.error("Error in sendResetPasswordEmailLink:", error);
            return res.status(500).send(sendTemplate(false, "Internal server error"));
        }
    };

    static resetPassword = async (req: Request<{}, {}, ResetPasswordReqBody>, res: Response) => {
        try {
            const { password, confirmPassword, id = '', token = '' } = req.body;



            if (!id) return res.status(400).send(sendTemplate(false, "user ID required"));
            if (!token) return res.status(400).send(sendTemplate(false, "Token required"));
            if (password !== confirmPassword) return res.status(400).send(sendTemplate(false, "Passwords do not match"));
            if (!isValidPassword(password)) return res.status(400).send(sendTemplate(false, "Invalid password format"));

            // Verify token and get user
            const decoded = verifyToken(token);
            if (!(decoded?.userId)) return res.status(400).send(sendTemplate(false, "Invalid or expired token"));
            if (id !== decoded.userId) return res.status(404).send(sendTemplate(false, 'Invalid user ID'))

            const user = await User.findById(decoded.userId);
            if (!user) return res.status(404).send(sendTemplate(false, "User not found"));

            // Update password and clear all sessions
            user.password = password;
            user.refreshTokens = []; // Invalidate all existing tokens
            await user.save();

            // Cleanup auth tracks
            await AuthTrack.updateOne(
                { userId: user._id },
                { $unset: { resetMailSentAt: 1 } }
            );

            // Clear auth cookies
            res.clearCookie('accessToken', cookieOptions);
            res.clearCookie('refreshToken', cookieOptions);

            return res.status(200).send(sendTemplate(true, "Password reset successful. Please login."));

        } catch (error) {
            console.error("Password reset error:", error);
            return error instanceof jwt.JsonWebTokenError
                ? res.status(401).send(sendTemplate(false, "Invalid token"))
                : res.status(500).send(sendTemplate(false, "Internal server error"));
        }
    };

    static logout = async (req: Request, res: Response) => {
        try {
            const userId = req.user?._id;
            const refreshToken = req.cookies.refreshToken;

            // Clear cookies regardless of auth status
            res.clearCookie('accessToken', cookieOptions);
            res.clearCookie('refreshToken', cookieOptions);

            if (userId && refreshToken) {
                // Remove only the specific refresh token
                await User.findByIdAndUpdate(
                    userId,
                    { $pull: { refreshTokens: refreshToken } }
                );
            }

            return res.status(200).send(sendTemplate(true, 'Logout Successful'));
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).send(sendTemplate(false, 'Internal server error during logout'));
        }
    };

    static changePassword = async (req: Request<{}, {}, ChangePasswordReqBody>, res: Response) => {
        try {
            const { password, confirmPassword, logout = false } = req.body;
            const userId = req.user?._id;

            if (!userId) return res.status(401).send(sendTemplate(false, 'Authentication required'));
            if (password !== confirmPassword) return res.status(400).send(sendTemplate(false, 'Passwords do not match'));
            if (!isValidPassword(password)) return res.status(400).send(sendTemplate(false, 'Password does not meet requirements'));

            const user = await User.findById(userId);
            if (!user) return res.status(404).send(sendTemplate(false, 'User not found'));

            // Check if new password matches old password
            if (await bcrypt.compare(password, user.password!)) {
                return res.status(400).send(sendTemplate(false, 'New password cannot be same as old'));
            }

            // Update password and clear all sessions
            user.password = password;
            user.refreshTokens = []; // Invalidate all existing tokens
            await user.save();

            // Clear cookies if logout requested
            if (logout) {
                res.clearCookie('accessToken', cookieOptions);
                res.clearCookie('refreshToken', cookieOptions);
            }

            return res.status(200).send(sendTemplate(true,
                logout ? 'Password changed and logged out' : 'Password changed successfully'
            ));

        } catch (error) {
            console.error('Password change error:', error);
            return res.status(500).send(sendTemplate(false, 'Internal server error'));
        }
    };

    static loggedin = async (req: Request, res: Response) => {
        try {
            const user = await User.findById(req.user?._id)
                .select('_id name username email googleId role profileSrcSm')
                .lean();

            if (user?.closedNow) return res.status(403).send(sendTemplate(false, "Account is closed, contact on support page"));

            return res.status(200).send(sendTemplate(true, "Successfully logged in", user));
        } catch (error) {
            console.error("Loggedin Check Error:", error);
            return res.status(500).send(sendTemplate(false, "Error checking login status."));
        }
    };

    static deleteUser = async (req: Request<{}, {}, DeleteUserBody>, res: Response) => {
        try {
            const userId = (req.user as IUser)._id;
            if (!userId) return res.status(401).send(sendTemplate(false, "Authentication required"));

            const { input = '' } = req.body;
            if (input !== 'Delete') return res.status(400).send(sendTemplate(false, "Invalid input for deletion"));

            // Atomic deletions
            await Promise.all([
                User.findByIdAndDelete(userId),
                Person.deleteOne({ userId }),
                AuthTrack.deleteOne({ userId }),
                Follow.deleteMany({ $or: [{ following: userId }, { follower: userId }] })
            ]);

            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            return res.status(200).send(sendTemplate(true, "Account deleted successfully"));
        } catch (error) {
            console.error("Delete User Error:", error);
            return res.status(500).send(sendTemplate(false, "Failed to delete account"));
        }
    };

}



export default UserController;