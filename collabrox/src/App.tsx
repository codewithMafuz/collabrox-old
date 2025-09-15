import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from './store/store';
import { setInnerWidth, setLeftWidthPercentage } from './appSlice';
import { setToast } from './toastSlice';
import { useNavigateCustom } from './hooks/useNavigateCustom';
import { useUserLoggedInQuery, User } from './apis/userApi';
import { resetState, setUserData } from './app/pages/userSlice';
import Layout from './Layout';
import { leftWidthPercentagesConfig } from './app/components/Sidebar';
import { getIsOptionalPath, getIsValidPath, SIDEBAR_ALLOWED_PATHS, SIDEBAR_NOT_ALLOWED_PATHS } from './routes';
import { Slide, ToastContainer } from 'react-toastify';
// import runSomeBrowserChecks from './services/browserService';
import useThrottling from './hooks/useThrottle';


export default function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

const AppContent = () => {
    const dispatch = useDispatch();
    const navigateIfNotAt = useNavigateCustom();
    const { pathname } = useLocation();

    const toastContainerOptions = useSelector((state: RootState) => state.toast.toastContainerOptions);
    const leftWidthPercentage = useSelector((state: RootState) => state.appState.leftWidthPercentage);

    const [isLg, setIsLg] = useState<boolean>(window.innerWidth >= 1024);
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    // call API and re-run query when pathname changes, but only if online
    const { data: loggedinResponse, isFetching } = useUserLoggedInQuery(pathname, { skip: !isOnline });

    const [loggedinUsername, setLoggedinUsername] = useState<string | null>(null);

    const { isRootPath, isInAuthPath, isOptionalPath, matchedWidthPercentage } = useMemo(() => ({
        isRootPath: pathname === '/',
        isInAuthPath: pathname.startsWith('/auth'),
        isOptionalPath: getIsOptionalPath(pathname),
        matchedWidthPercentage: leftWidthPercentagesConfig.find(item =>
            new RegExp(item.regex).test(pathname)
        )?.percent ?? 70,
    }), [pathname]);

    useEffect(() => {
        if (!isFetching) {
            const data = loggedinResponse?.data;
            if (data) {
                console.log(data)
                setLoggedinUsername(data.username!);

                dispatch(setUserData({
                    ...data,
                    profileSrcSm: data.profileSrcSm
                }));
            } else {
                setLoggedinUsername(null);
                dispatch(resetState());
            }
        }
    }, [loggedinResponse?.data, isFetching]);

    // set left width percentage of sidebar
    useEffect(() => {
        if (leftWidthPercentage !== matchedWidthPercentage) {
            dispatch(setLeftWidthPercentage(matchedWidthPercentage));
        }
    }, [leftWidthPercentage, matchedWidthPercentage]);

    // some paths management (like redirection)
    useEffect(() => {
        // if currently fetching/checking is loggedin ... 
        if (isFetching) {
            console.log('loggedin isFetching...')
            // then return (skip everything)
            return
        }

        // if user is in root page ('/') OR user is in authentication required page...
        if (isRootPath || !isOptionalPath) {
            // then redirect to user's own person/profile page path if authenticatd, otherwise to login path
            navigateIfNotAt({ url: loggedinUsername ? `/${loggedinUsername}` : '/auth/login', replace: true });
            return
        }
    }, [isFetching, loggedinUsername, isRootPath, isInAuthPath, isOptionalPath]);

    // throttled window resize handler
    const handleResize = useThrottling(() => {
        setIsLg(window.innerWidth >= 1024);
        dispatch(setInnerWidth());
    });

    // online/offline and resize event listeners
    useEffect(() => {
        // running some browser checks and cache sets
        // runSomeBrowserChecks();

        // Window online/offline event handlers
        // Send alert when user becomes online Or offline
        const handleOnline = () => {
            setIsOnline(true);
            dispatch(setToast({ content: 'You are online', toastOptions: { type: 'success' } }));
        };

        const handleOffline = () => {
            setIsOnline(false);
            dispatch(setToast({ content: 'You are offline', toastOptions: { type: 'error' } }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const ToastContainerBox = useMemo(() => <ToastContainer transition={Slide} {...toastContainerOptions} />, [toastContainerOptions]);

    return (
        <>
            <Routes>
                <Route
                    path="/"
                    element={<Layout isRootPath={isRootPath} isLg={isLg} />}
                >
                    {SIDEBAR_ALLOWED_PATHS.map((route, index) => (
                        <Route key={index} path={route.path} element={route.element} />
                    ))}
                </Route>
                {SIDEBAR_NOT_ALLOWED_PATHS.map((route, index) => (
                    <Route key={index} path={route.path} element={route.element} />
                ))}
            </Routes>


            {ToastContainerBox}
        </>
    );
}