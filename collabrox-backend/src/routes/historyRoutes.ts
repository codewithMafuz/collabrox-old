import express, { RequestHandler } from 'express';
import HistoryController from '../controllers/HistoryController.js';
import checkAuth from '../middleware/checkAuth.js';
import { Route } from '@app-types/route.js';
// import addOptionalFlag from 'src/middleware/addFlags.js';

const router = express.Router();

const protectedRoutes: Route[] = [
    { path: '/search', method: 'get', handler: HistoryController.getSearchHistory },
    { path: '/search/add', method: 'post', handler: HistoryController.addSearchHistory },
    { path: '/search/remove/:uniqueId', method: 'delete', handler: HistoryController.removeSearchHistory },
    { path: '/search/clear', method: 'delete', handler: HistoryController.clearSearchHistory }
];

// const publicRoutes : Route[] = [

// ]

// const optionalRoutes : Route[] = [

// ]

// Apply checkAuth middleware to all protected routes
router.use(protectedRoutes.map(routeObj => routeObj.path), checkAuth as RequestHandler);

// Apply checkAuth middleware to all protected routes
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