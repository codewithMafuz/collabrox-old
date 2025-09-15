import express, { RequestHandler } from 'express';
import PersonController from '../controllers/PersonController.js';
import checkAuth from '../middleware/checkAuth.js';
import { Route } from '../types/route.js';
import addOptionalFlag from '../middleware/addFlags.js';
// import multer from 'multer';

// const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

// Route configurations
const protectedRoutes: Route[] = [
    { path: '/:username/similarity', method: 'get', handler: PersonController.getSimilarPersons },
    { path: '/general-data/update', method: 'patch', handler: PersonController.updateGeneralData },
    { path: '/about/update', method: 'patch', handler: PersonController.updateAbout },
    { path: '/skill/add', method: 'post', handler: PersonController.addSkill },
    { path: '/skill/update', method: 'patch', handler: PersonController.updateSkill },
    { path: '/skill/remove/:skillName', method: 'delete', handler: PersonController.removeSkill },
    { path: '/experience/add', method: 'post', handler: PersonController.addExperience },
    { path: '/experience/update', method: 'patch', handler: PersonController.updateExperience },
    { path: '/experience/remove', method: 'delete', handler: PersonController.removeExperience },
    { path: '/image/banner/update', method: 'patch', handler: PersonController.updatePersonBannerImage },
    { path: '/image/banner/delete', method: 'delete', handler: PersonController.deletePersonBannerImage },
    { path: '/image/profile/update', method: 'patch', handler: PersonController.updatePersonProfileImage },
    { path: '/image/profile/delete', method: 'delete', handler: PersonController.deletePersonProfileImage },
    { path: '/language/add', method: 'post', handler: PersonController.addPersonProfileLanguage },
    { path: '/language/remove', method: 'delete', handler: PersonController.removePersonProfileLanguage },
];

const optionalRoutes: Route[] = [
    { path: '/:username', method: 'get', handler: PersonController.getPersonData },
    { path: '/:username/about', method: 'get', handler: PersonController.getAbout },
    { path: '/:username/skills-and-experiences', method: 'get', handler: PersonController.getSkillsAndExperiences },
];

// Applying middleware
router.use(protectedRoutes.map(routeObj => routeObj.path), checkAuth as RequestHandler);
router.use(optionalRoutes.map(routeObj => routeObj.path), addOptionalFlag(checkAuth as RequestHandler));

// Register routes
[
    ...protectedRoutes,
    ...optionalRoutes,
].forEach(({ path, method, handler }) => {
    router[method](path, handler);
});

export default router;
