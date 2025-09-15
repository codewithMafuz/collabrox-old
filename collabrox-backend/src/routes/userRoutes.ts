import express, { RequestHandler } from 'express';
import UserController from '../controllers/UserController.js';
import checkAuth from '../middleware/checkAuth.js';
import { Route } from '@app-types/route.js';
import addOptionalFlag from 'middleware/addFlags.js';

const router = express.Router();


export const publicRoutes: Route[] = [
    { path: '/signup', method: 'post', handler: UserController.signup },
    { path: '/verify-signup/:userId/:token', method: 'get', handler: UserController.verifySignupConfirmation },
    { path: '/login', method: 'post', handler: UserController.login },
    { path: '/google-signin', method: 'post', handler: UserController.googleSignIn },
    { path: '/github-signin', method: 'post', handler: UserController.githubSignIn },
    { path: '/send-reset-password-email-link', method: 'post', handler: UserController.sendResetPasswordEmailLink },
    { path: '/reset-password', method: 'post', handler: UserController.resetPassword },

];

const optionalRoutes: Route[] = [
    { path: '/logout', method: 'post', handler: UserController.logout },
];

const protectedRoutes: Route[] = [
    { path: '/loggedin', method: 'get', handler: UserController.loggedin },
    { path: '/delete', method: 'delete', handler: UserController.deleteUser },
    { path: '/change/password', method: 'patch', handler: UserController.changePassword }
];

// Apply checkAuth middleware to all protected routes
router.use(protectedRoutes.map(routeObj => routeObj.path), checkAuth as RequestHandler);
router.use(optionalRoutes.map(routeObj => routeObj.path), addOptionalFlag(checkAuth as RequestHandler));

// Register routes
[
    ...protectedRoutes,
    ...optionalRoutes,
    ...publicRoutes
].forEach(({ path, method, handler }) => {
    router[method](path, handler);
});

export default router;