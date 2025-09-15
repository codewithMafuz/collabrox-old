import { FRONTEND_BASE_URL, PORT, PRIMARY_MONGODB_URI } from './constants/envVars.js';
import express from 'express';
import cors from 'cors';
import connectDB from './config/connectDB.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import followRoutes from './routes/followRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import personRoutes from './routes/personRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import rateLimit from 'express-rate-limit';

const app = express();

// Database Connection
const connectionWithDB = await connectDB(PRIMARY_MONGODB_URI);
if (typeof connectionWithDB !== 'string') {
    throw new Error(`Error while trying to connect mongodb (PRIMARY_MONGODB_URI=${PRIMARY_MONGODB_URI})`)
}
console.log(connectionWithDB)

// CORS options (allowing credentials)
const corsOptions = {
    origin: FRONTEND_BASE_URL,
    credentials: true,
    optionsSuccessStatus: 200
};

// CORS Middleware
app.use(cors(corsOptions));

// Cookie Parser Middleware
app.use(cookieParser());

// JSON Middleware
// To parse JSON request bodies
app.use(express.json());

// URL-encoded Middleware
// To parse URL-encoded request bodies (generally for forms)
app.use(express.urlencoded({ extended: true }));

// Addrate limiter middleware to prevent too many request from a single ip or bruite force attack
const rateLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (per 2 minutes).
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: 'Too many attempts',
    skipSuccessfulRequests: false,
})

app.use(rateLimiter);

// Routes
// v1 (verson : 1) api routes
app.use('/api/v1/user', userRoutes); // User person routes
app.use('/api/v1/follow', followRoutes); // Follow (follow/unfollow and others) related routes
app.use('/api/v1/history', historyRoutes); // History related routes
app.use('/api/v1/person', personRoutes); // Person related routes
app.use('/api/v1/search', searchRoutes); // Search routes

// // Global Error Handler
// app.use((error: any, _: Request, res: Response, __: NextFunction) => {
//     console.error("Unhandled Error:", error.stack || error);
//     res.status(error.status || 500).send(sendTemplate(false, error.message || "Internal server error"))
// });


export const AppName = 'Collabrox'

// Start Server
app.listen(PORT || 8000, () => {
    console.log(`Server listening at http://localhost:${PORT || 8000}`);
});

