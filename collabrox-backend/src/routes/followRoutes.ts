import express, { RequestHandler } from 'express';
import FollowController from '../controllers/FollowController.js';
import checkAuth from '../middleware/checkAuth.js';
import { Route } from '@app-types/route.js';
// import addOptionalFlag from 'src/middleware/addFlags.js';

const router = express.Router();

const protectedRoutes: Route[] = [
    // person related
    { path: '/person/search/followings/:keyword', method: 'get', handler: FollowController.getFollowingsQuery },
    { path: '/person/search/followers/:keyword', method: 'get', handler: FollowController.getFollowersQuery },

    { path: '/person/:username/followings', method: 'get', handler: FollowController.getFollowings },
    { path: '/person/:username/followers', method: 'get', handler: FollowController.getFollowers },

    { path: '/person/check-following/:targetPersonId', method: 'get', handler: FollowController.checkFollowing },
    { path: '/person/toggle/:targetPersonId', method: 'post', handler: FollowController.toggleFollow }

    // 
];

// const publicRoutes : Route[] = [

// ]

// const optionalRoutes : Route[] = [

// ]

// Apply authentication optional to optional routes
router.use(protectedRoutes.map(routeObj => routeObj.path), checkAuth as RequestHandler);

// Apply authentication optional to optional routes
// router.use(optionalRoutes.map(routeObj => routeObj.path), addOptionalFlag(checkAuth as RequestHandler));

// Register routes
[
    ...protectedRoutes,
    // ...optionalRoutes,
    // ...publicRoutes
].forEach(({ path, method, handler }) => {
    router[method](path, handler);
});

export default router;