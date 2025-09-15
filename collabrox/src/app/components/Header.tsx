import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetState } from '../pages/userSlice';
import { resetPersonState } from '../pages/person/personSlice';
import { MdFeed, MdWork, MdSettings, MdArrowDropDown, MdLogout, MdKeyboardDoubleArrowRight, MdNotificationsActive, MdHelp } from "react-icons/md";
import Link from '../common/Link';
import Logo from '../../assets/component-images/Logo';
import Typography from '../common/Typography';
import { useNavigateCustom } from '../../hooks/useNavigateCustom';
import SearchBox from './SearchBox';
import { classNames, textShorteningByWord } from '../../lib/StringUtils';
import ImageBox from '../common/ImageBox';
import { RootState } from '../../store/store';
import { useUserLogoutMutation } from '../../apis/userApi';
import Button from '../common/Button';
import emptyProfile from '../../assets/images/profile-empty.avif'
import Modal from '../common/Modal';
import useShowToast from '../../hooks/useShowToast';


export const headerHeight = '46px';
export const headerWidth = '100%';

export default function Header() {
    const dispatch = useDispatch();
    const navigateIfNotAt = useNavigateCustom();
    const { pathname, search } = useLocation();
    const showToast = useShowToast()

    const queryParams = new URLSearchParams(search)

    const loggedUsername = useSelector((state: RootState) => state.user.username);
    const { name, profileSrcSm, bio } = useSelector((state: RootState) => state.person);

    const [showPersonBarByClick, setShowPersonBarByClick] = useState<boolean>(false);
    const showingPersonBar = useRef<boolean>(false)
    const [showLogoutAlert, setShowLogoutAlert] = useState<boolean>(false);
    const [showLogoSm, setShowLogoSm] = useState<boolean>(true);
    const profileImg = useRef<HTMLImageElement>(null);
    const personBar = useRef<HTMLDivElement>(null);
    const [isFocusedSearchBox, setIsFocusedSearchBox] = useState<boolean>(false)
    const [logout] = useUserLogoutMutation()

    useEffect(() => {
        if (pathname) {
            setShowPersonBarByClick(false)
        }
    }, [pathname])

    const handleClickToShowPersonBar = () => {
        showingPersonBar.current = !showPersonBarByClick
        setShowPersonBarByClick(prev => !prev)
    }

    useEffect(() => {
        // an event mousedown | touchstart event listener that always gonna stay and can be use for many things
        const handleTouchDocument = (ev: MouseEvent | TouchEvent) => {
            const target = ev.target as Node | HTMLElement
            // checking for interaction that can hide personBar
            if (
                showingPersonBar.current &&
                profileImg.current && !(profileImg.current === target) &&
                personBar.current && !(personBar.current === target) && !personBar.current.contains(target)
            ) {
                setShowPersonBarByClick(false);
            }
            // checking for interaction that on suggestionBox, which means can hide logo
            if (isFocusedSearchBox) {
                setShowLogoSm(false)
            } else {
                setShowLogoSm(true)
            }
        };

        document.addEventListener('mousedown', handleTouchDocument);
        document.addEventListener('touchstart', handleTouchDocument);

        return () => {
            // events cleanup when unmounts
            document.removeEventListener('mousedown', handleTouchDocument);
            document.removeEventListener('touchstart', handleTouchDocument);
        };
    }, []);

    const isLoginPage = pathname === '/auth/login'

    return (
        <>
            <header id="mainHeader" style={{ height: headerHeight, width: headerWidth }} className="fixed bg-gray-900 z-[100] top-0 left-0">
                {/* Logout confirmation box */}
                {showLogoutAlert && (
                    <Modal
                        title='Logout your account'
                        isOpen={true}
                        key="logoutAccount"
                        onCancel={() => setShowLogoutAlert(false)}
                        onClose={() => setShowLogoutAlert(false)}
                        onConfirm={async () => {
                            if (!navigator.onLine) return showToast('Failed to Log out - No internet connection');
                            const result = await logout()
                            if ('error' in result) {
                                console.error("Logout failed", result.error)
                                showToast(`Failed to Log out - ${result.error}`)
                                return;
                            }

                            setShowLogoutAlert(false);
                            dispatch(resetState());
                            dispatch(resetPersonState());
                            navigateIfNotAt({ url: '/auth/login', replace: true });
                        }}
                        confirmBtnColor="danger"
                        cancelBtnColor="light"
                    />
                )}

                {/* nav */}
                <nav
                    id="mainNav"
                    className="relative w-full h-full px-2 sm:px-[16px] md:px-[40px] lg:px-[120px] xl:px-[180px] flex items-center justify-between gap- drop-shadow-sm shadow-inner"
                >
                    {/* left side inside navbar */}
                    <div className="flex items-center justify-center lg:gap-10">
                        {/* logoBox */}
                        <div className={classNames('h-full flex items-center justify-center', showLogoSm ? 'max-lg:flex' : 'max-lg:hidden', 'items-center')}>
                            {/* convert links to the custom link, and change wider screen navlink color, fix it */}
                            <Link
                                to={loggedUsername ? `/${loggedUsername}` : pathname}
                                id="logo"
                                className="text-gray-100 font-mono tracking-tight italic text-lg"
                                replace={pathname.includes('/auth')}
                            >
                                <Logo style={{ width: 86 }} />
                            </Link>
                        </div>

                        {/* wider screen navigation links box */}
                        {loggedUsername &&
                            <div className="h-full hidden lg:flex justify-center items-center lg:gap-8">
                                <Link
                                    to='/jobs'
                                    replace={false}
                                    className={`relative flex items-center justify-center flex-col ${pathname === '/jobs' ? 'text-white' : 'text-gray-100'}`}
                                >
                                    <MdWork className="text-[1rem]" />
                                    <span className='text-[.80rem] font-[400]'>Jobs</span>
                                    {pathname === '/jobs' &&
                                        <span className="absolute bottom-[-4px] left-[-5px] w-[calc(100%+10px)] h-[3px] rounded-se-full rounded-ss-full bg-indigo-500 "></span>
                                    }
                                </Link>
                            </div>}
                    </div>

                    {/* right side inside navbar */}
                    <div className="flex items-center justify-center gap-3 sm:gap-2 md:gap-4 lg:gap-4 xl:gap:5">
                        {/* searchbox */}
                        <div className="h-full flex items-center justify-center">
                            <SearchBox
                                setIsFocusedSearchBox={(focus) => setIsFocusedSearchBox(focus)}
                                defaultValue={
                                    pathname === '/search' ?
                                        (queryParams.get("query") || '') : ''
                                }
                            />
                        </div>

                        {/* {!isFetching && */}
                        <div className="relative group">
                            {/* profileImg */}
                            {loggedUsername ?
                                <div style={{ height: headerHeight, width: 'auto' }} className="relative flex flex-col justify-center items-center pt-0.5">
                                    <ImageBox
                                        ref={profileImg}
                                        id="navProfileImg"
                                        imgSrc={profileSrcSm || emptyProfile}
                                        alt='ProfileImg'
                                        height='30px'
                                        width='30px'
                                        className={`rounded-full ${showPersonBarByClick ? ' outline outline-2 outline-indigo-500' : ''}`}
                                        onClick={handleClickToShowPersonBar}
                                    />

                                    <button
                                        onClick={handleClickToShowPersonBar}
                                        className="flex items-center justify-center gap-0.5">
                                        <span className='text-[.8rem] text-white leading-[10px]'>Me</span>
                                        <MdArrowDropDown className='text-[1.05rem] text-white leading-[10px]' />
                                    </button>
                                </div>
                                :
                                <Button
                                    title={isLoginPage ? 'Login' : 'Signup'}
                                    onClick={() => {
                                        navigateIfNotAt({ url: isLoginPage ? `/auth/signup` : `/auth/login`, replace: true })
                                    }}
                                    color='primary'
                                    sz='lg'>
                                    {isLoginPage ? 'Signup' : 'Login'}
                                </Button>
                            }

                            {/* personBar */}
                            {loggedUsername &&
                                <div
                                    id="personBar"
                                    ref={personBar}
                                    className={`personBar absolute z-10 w-[220px] lg:w-[24vw] h-auto right-0 lg:p-2 min-h-[200px] lg:min-h-[150px] flex flex-col gap-3 lg:gap-1.5 bg-white text-gray-900 border border-gray-300 rounded-md shadow-xl transition-[.5s] animate-fadeIn ${showPersonBarByClick ? 'visible opacity-100' : 'invisible group-hover:visible opacity-0 group-hover:opacity-100'}`}
                                >
                                    <>
                                        {loggedUsername &&
                                            <>
                                                {/* person, name, bio showup box */}
                                                <div className="personRelatedLinks flex flex-col items-center justify-center mx-1 lg:mx-2 mt-3 lg:mt-2 gap-[1vw]">
                                                    <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-x-3">
                                                        <div className="imgBox flex items-center justify-center text-blue-500">
                                                            <ImageBox
                                                                height='40px'
                                                                width='40px'
                                                                imgSrc={profileSrcSm || emptyProfile}
                                                                alt='ProfileImg'
                                                            />
                                                        </div>
                                                        <div className="w-full flex">
                                                            <Link
                                                                to={`/${loggedUsername}`}
                                                                className={`w-fit px-1 font-semibold border-b leading-none border-b-gray-700 text-[1rem] text-center lg:text-left ${loggedUsername && pathname.includes(loggedUsername) ? 'text-indigo-500 active:text-indigo-400 hover:text-indigo-400' : 'hover:text-gray-800 active:text-gray-800'}`}
                                                                replace={false}
                                                            >
                                                                {name}
                                                            </Link>
                                                        </div>
                                                    </div>
                                                    <Typography variant="p" className="px-0.5 text-left">
                                                        {textShorteningByWord(bio || '', 100)}
                                                    </Typography>
                                                </div>

                                                {/* navigation links of explore related box */}
                                                <div className="exploreLinks flex flex-col gap-1 py-1 lg:hidden">
                                                    <Typography variant='title' className="pl-1 lg:pl-2 xl:pl-3">Explore</Typography>
                                                    <div className="flex flex-col items-start justify-center text-gray-600">
                                                        <Link
                                                            to="/jobs"
                                                            className={`w-full cursor-pointer flex items-center justify-start pl-8 gap-1 transition-[colors] ${pathname === '/jobs' ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-transparent hover:bg-indigo-500 hover:text-white'}`}
                                                            replace={false}
                                                        >
                                                            <MdWork className="text-[1rem]" />
                                                            <span>Jobs</span>
                                                        </Link>
                                                    </div>
                                                </div>

                                                {/* naivgation links of account related box */}
                                                <div className="accountLinks flex flex-col gap-1 py-1">
                                                    <Typography variant='title' className="pl-1 lg:pl-2 xl:pl-3">Explore</Typography>
                                                    <div className="flex flex-col items-start justify-center text-gray-600">
                                                        <Link
                                                            to="/settings"
                                                            className={`w-full cursor-pointer flex items-center justify-start pl-8 gap-1 transition-[colors] hover:text-white hover:bg-indigo-500 ${pathname === '/settings' ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-transparent hover:bg-indigo-500 hover:text-white'}`}
                                                            replace={false}
                                                        >
                                                            <MdSettings className="text-[1rem]" />
                                                            <span>Settings</span>
                                                        </Link>
                                                        <Link
                                                            to="/faq/helps"
                                                            className={`w-full cursor-pointer flex items-center justify-start pl-8 gap-1 transition-[colors] hover:text-white hover:bg-indigo-500 ${pathname === '/faq/helps' ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'bg-transparent hover:bg-indigo-500 hover:text-white'}`}
                                                            replace={false}
                                                        >
                                                            <MdHelp className="text-[1rem]" />
                                                            <span>Helps</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </>
                                        }

                                        {/* Logout / Login */}
                                        <div className="accountLinks flex flex-col gap-1 py-1">
                                            <Link
                                                to={loggedUsername ? '' : '/auth/login'}
                                                className='w-full cursor-pointer flex items-center justify-start pl-8 gap-1 transition-[colors] hover:text-white hover:bg-indigo-500'
                                                onClickLink={() => {
                                                    if (loggedUsername) {
                                                        setShowLogoutAlert(true);
                                                    }
                                                }}
                                            >
                                                {loggedUsername ?
                                                    <>
                                                        <MdLogout className="text-[1rem]" />
                                                        <span>Logout</span>
                                                    </>
                                                    :
                                                    <>
                                                        <MdKeyboardDoubleArrowRight className="text-[1rem]" />
                                                        <span>Login</span>
                                                    </>
                                                }
                                            </Link>
                                            {!loggedUsername &&
                                                <Link
                                                    to='/auth/signup'
                                                    className='w-full cursor-pointer flex items-center justify-start pl-8 gap-1 transition-[colors] hover:text-white hover:bg-indigo-500'
                                                >
                                                    <MdKeyboardDoubleArrowRight className="text-[1rem]" />
                                                    <span>Signup</span>
                                                </Link>
                                            }
                                        </div>
                                    </>
                                </div>
                            }
                        </div>
                        {/* } */}
                    </div>

                </nav>
            </header >
        </>
    );
}
