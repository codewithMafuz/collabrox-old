import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { APIErrorResponseTemplate, useUserLoginMutation } from '../../../apis/userApi';
import { isValidEmailAddress, isValidPassword } from '../../../services/validationServices';
import { useDispatch } from 'react-redux';
import { resetState, setUserData } from '../userSlice';
import AuthFormTemplate, { MsgBox } from '../../shared/AuthFormTemplate';
import PageWrapper from '../../shared/PageWrapper';
import { useSearchParams } from 'react-router-dom';
import { useNavigateCustom } from '../../../hooks/useNavigateCustom';
import Button from '../../common/Button';
import InputEmail from '../../common/InputEmail';
import InputPassword from '../../common/InputPassword';
import GoogleButton from '../../common/GoogleButton';
import GithubButton from '../../common/GithubButton';
import LottieAnimation from '../../shared/LottieAnimation';
import Typography from '../../common/Typography';
import SecurePulseAnimation from '../../../assets/animations/json/secure-pulse-animation.json'
import InputCheck from '../../common/InputCheck';
import { getIsValidPath } from '../../../routes';


const Login: React.FC = () => {
    const navigate = useNavigateCustom();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();

    const redirectOnSuccess = searchParams.get('redirect');

    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string>('');

    const [msgBox, setMsgBox] = useState<MsgBox>({});

    const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
    const [isPending, setIsPending] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const [login] = useUserLoginMutation();

    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    const showMsgBox = (txt: typeof msgBox.txt = '', type: typeof msgBox.type = 'danger') => {
        setMsgBox({ txt, type })
    }

    const handleLogin = useCallback(async (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        try {
            if (!navigator.onLine) return showMsgBox('No internet connection')

            if (disableSubmit) return;

            setIsPending(true);

            // some resettable things
            showMsgBox();
            setEmailError('')
            dispatch(resetState());

            if (!email || !isValidEmailAddress(email)) return setEmailError('Email is invalid');

            // Extracting the `password` from formData to avoid unnecessary state
            const formData = new FormData(ev.target as HTMLFormElement);

            const password = (formData?.get('password') || '') as string;
            if (!password || !isValidPassword(password)) return showMsgBox('Invalid email or password');

            // Keeping forced disabled the submit button after each login request to server
            const timer = setTimeout(() => setDisableSubmit(false), 4000);
            timerRef.current = timer

            // Trying login to server
            const { data: response, error } = await login({ email, password }) || {};

            if (error) {
                const { data, error: errorMsg } = (error as APIErrorResponseTemplate)
                return showMsgBox(data?.message || errorMsg || 'Something went wrong');
            }

            const { data, message, status = 'Failed' } = response || {};
            if (status === 'Failed') return showMsgBox(message!);

            const { username, _id } = data!;
            // Storing to redux store
            dispatch(setUserData({ username, _id }));

            // Redirecting to the 
            navigate({ url: typeof redirectOnSuccess === 'string' && getIsValidPath(redirectOnSuccess) ? redirectOnSuccess : `/${username}`, replace: true });
        }
        catch (error) {
            console.log(error);
            showMsgBox('Something went wrong, try again');
        }
        finally {
            setIsPending(false);
        }

    }, [disableSubmit, email]);

    const sideBox =
        <div className="transition-all w-full h-full flex flex-col items-center justify-center gap-4">
            <LottieAnimation
                animationData={SecurePulseAnimation}
                style={{ width: 360, height: 360 }}
            />
            <Typography variant='subtitle'>Stay secured and informed</Typography>
        </div>

    return (
        <PageWrapper>
            <AuthFormTemplate
                id="login"
                title="Login"
                sideBox={sideBox}
                msgBox={msgBox || ''}
                bottomLinks={[
                    { prefix: 'Do not have an account?', linkText: 'Signup', pathname: '/auth/signup' },
                    { linkText: 'Forgot password', pathname: '/auth/forgot-password', replace: false },
                ]}
            >
                <form
                    noValidate
                    onSubmit={handleLogin}
                    className="flex flex-col items-center justify-center gap-3"
                    method="POST"
                    role="form"
                    aria-label="form"
                >
                    <div className='w-full flex flex-col items-center justify-center gap-3 p-2'>
                        <div className="flex flex-col w-full gap-y-2">
                            <label htmlFor="email" className="w-full">
                                <Typography variant='p' className='ml-1 mb-0.5 h-5 font-medium' color='danger' role='alert'>&nbsp;{emailError}</Typography>
                                <InputEmail
                                    id="email"
                                    name='email'
                                    sz='md'
                                    col='light'
                                    autoFocus={true}
                                    placeholder='Email'
                                    onInput={(email) => {
                                        setEmail(email);
                                        setDisableSubmit(false);
                                        setEmailError('');
                                    }}
                                    aria-describedby="email-error"
                                    aria-invalid={!!emailError}
                                />
                            </label>
                            <label htmlFor="password" className="w-full">
                                <Typography variant='p' className='ml-1 mb-0.5 h-5 font-medium' color='danger'>&nbsp;</Typography>
                                <InputPassword
                                    id='password'
                                    name='password'
                                    sz='md'
                                    col='light'
                                    placeholder='Password'
                                    onInput={() => setDisableSubmit(false)}
                                />
                            </label>
                        </div>
                        <div className="w-full ml-3">
                            <InputCheck
                                id='keepLoggedin'
                                label='Keep me loggedin'
                                disabled
                                defaultChecked={true}
                                name='keepLoggedin'
                                col='dark'
                                sz='md'
                                rounded='full'
                            />
                        </div>
                    </div>
                    <Button
                        col='dark'
                        sz='md'
                        type='submit'
                        rounded='full'
                        className='w-[90%]'
                        disabled={disableSubmit || isPending}
                        isLoading={isPending}
                        loadingAnimation='spinner'
                        childrenOnLoading='Logging'
                    >
                        Login
                    </Button>
                    <div className="mt-5 flex items-center justify-center gap-4">
                        <GoogleButton setIsPending={setIsPending} />
                        <GithubButton setIsPending={setIsPending} />
                    </div>
                </form>
            </AuthFormTemplate>
        </PageWrapper>
    );
};

export default Login;
