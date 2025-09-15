import express, { RequestHandler } from 'express';
import SearchController from '../controllers/SearchController.js';
import checkAuth from '../middleware/checkAuth.js';
import { Route } from '../types/route.js';
import addOptionalFlag from '../middleware/addFlags.js';

const router = express.Router();

const optionalRoutes: Route[] = [
    { path: '/suggestions/keyword/all/:keyword', method: 'get', handler: SearchController.getKeywordSuggestions },

    { path: '/search/persons', method: 'get', handler: SearchController.getPersons },
];

// const publicRoutes : Route[] = [

// ]

// const optionalRoutes : Route[] = [

// ]

// Apply optionalAuth wrapper middleware to all routes in this file
router.use(optionalRoutes.map(routeObj => routeObj.path), addOptionalFlag(checkAuth as RequestHandler));

// Register routes
// Register routes
[
    // ...protectedRoutes,
    ...optionalRoutes,
    // ...publicRoutes
].forEach(({ path, method, handler }) => {
    router[method](path, handler);
});

export default router;