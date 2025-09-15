import Person from './app/pages/person/Person';
import SearchResults from './app/pages/searchResults/SearchResults';
import Settings from './app/pages/settings/Settings';
import Terms from './app/pages/Terms/Terms';
import Login from './app/pages/login/Login';
import Signup from './app/pages/signup/Signup';
import ForgetPassword from './app/pages/forgetPassword/ForgetPassword';
import ResetPassword from './app/pages/resetPassword/ResetPassword';
import SignupComplete from './app/pages/signupComplete/SignupComplete';
import PageNotFound from './app/pages/pageNotFound/PageNotFound';
import About from './app/pages/about/About';
import type { JSX } from 'react';
import Jobs from './app/pages/jobs/Jobs';

/**
 * A single “route” item, used in sidebar or in routing table.
 */
export interface RouteItem {
    readonly path: string;
    readonly element: JSX.Element;
    readonly name?: string;
    /** whether this route is considered “optional” for sidebar/highlighting logic */
    readonly optional: boolean;
}

/**
 * All the routes that are allowed to appear in the sidebar (and their labels, etc).
 */
export const SIDEBAR_ALLOWED_PATHS = [
    { path: "/", element: <div></div>, name: 'Root Path', optional: true },
    { path: "/:username", element: <Person />, name: 'My profile', optional: true },
    { path: "/jobs", element: <Jobs />, name: 'Jobs', optional: true },
    { path: "/search", element: <SearchResults />, name: 'Search', optional: true },
    { path: "/settings", element: <Settings />, name: 'Settings', optional: false },
    { path: "/terms-of-services", element: <Terms />, name: 'Terms and services', optional: true },
    { path: "/about", element: <About />, name: 'About', optional: true },
] as const;

/**
 * Routes that should NOT appear in the sidebar (authentication pages, 404, etc).
 */
export const SIDEBAR_NOT_ALLOWED_PATHS = [
    { path: '/auth/login', element: <Login />, optional: true },
    { path: '/auth/signup', element: <Signup />, optional: true },
    { path: '/auth/forgot-password', element: <ForgetPassword />, optional: true },
    { path: '/auth/reset-password/:id/:token', element: <ResetPassword />, optional: true },
    { path: '/auth/complete-signup/:id/:token', element: <SignupComplete />, optional: true },
    { path: '/settings', element: <Settings />, name: 'Settings', optional: false },
    { path: '*', element: <PageNotFound />, optional: true },
] as const;

export type SidebarAllowedPath = typeof SIDEBAR_ALLOWED_PATHS[number]['path'];
export type SidebarNotAllowedPath = typeof SIDEBAR_NOT_ALLOWED_PATHS[number]['path'];
export type AllRoutesPath = SidebarAllowedPath | SidebarNotAllowedPath;
export type ValidRoutesPath = Exclude<AllRoutesPath, '*'>;


export const ALL_ROUTES: readonly RouteItem[] = [
    ...SIDEBAR_ALLOWED_PATHS,
    ...SIDEBAR_NOT_ALLOWED_PATHS
];

export const ALL_ROUTES_PATHS = ALL_ROUTES.map(r => r.path);

export const OPTIONAL_PATHS = ALL_ROUTES
    .filter(r => r.optional && r.path !== '*')
    .map(r => r.path) as ValidRoutesPath[];

const ROUTE_REGEX_ENTRIES = [
    ['/', new RegExp('^/$')],
    ['/:username', new RegExp('^/([a-zA-Z0-9_-]+)$')],
    ['/jobs', new RegExp('^/jobs$')],
    ['/search', new RegExp('^/search$')],
    ['/settings', new RegExp('^/settings$')],
    ['/terms-of-services', new RegExp('^/terms-of-services$')],
    ['/about', new RegExp('^/about$')],
    ['/auth/login', new RegExp('^/auth/login$')],
    ['/auth/signup', new RegExp('^/auth/signup$')],
    ['/auth/forgot-password', new RegExp('^/auth/forgot-password$')],
    ['/auth/reset-password/:id/:token', new RegExp('^/auth/reset-password/(\\d+)/([a-zA-Z0-9_-]+)$')],
    ['/auth/complete-signup/:id/:token', new RegExp('^/auth/complete-signup/(\\d+)/([a-zA-Z0-9_-]+)$')],
] as const satisfies ReadonlyArray<readonly [ValidRoutesPath, RegExp]>;


export const ALL_ROUTES_REGEX: Record<ValidRoutesPath, RegExp> =
    ROUTE_REGEX_ENTRIES.reduce((acc, [path, regex]) => {
        acc[path] = regex;
        return acc;
    }, {} as Record<ValidRoutesPath, RegExp>);

export const ALL_ROUTE_REGEX_ARRAY: readonly RegExp[] =
    ROUTE_REGEX_ENTRIES.map(([_, regex]) => regex);

const OPTIONAL_ROUTE_REGEX_ENTRIES =
    ROUTE_REGEX_ENTRIES.filter(([path, _]) =>
        OPTIONAL_PATHS.includes(path)
    ) as ReadonlyArray<readonly [ValidRoutesPath, RegExp]>;

export const OPTIONAL_ROUTES_REGEX: Record<ValidRoutesPath, RegExp> =
    OPTIONAL_ROUTE_REGEX_ENTRIES.reduce((acc, [path, regex]) => {
        acc[path] = regex;
        return acc;
    }, {} as Record<ValidRoutesPath, RegExp>);

export const OPTIONAL_ROUTE_REGEX_ARRAY: readonly RegExp[] =
    OPTIONAL_ROUTE_REGEX_ENTRIES.map(([_, regex]) => regex);


// utility functions
export const getIsValidPath = (pathname: string): boolean => ALL_ROUTE_REGEX_ARRAY.some((r) => r.test(pathname));

export const getIsOptionalPath = (pathname: string): boolean =>
    !getIsValidPath(pathname) || OPTIONAL_ROUTE_REGEX_ARRAY.some(r => r.test(pathname));


export default ALL_ROUTES;
