import React, { useEffect, useState, useCallback, useRef } from "react";
import { APIErrorResponseTemplate, useUserSignupMutation } from "../../../apis/userApi";
import { isValidEmailAddress, isValidFullName, isValidPassword } from "../../../services/validationServices";
import AuthFormTemplate, { MsgBox } from "../../shared/AuthFormTemplate";
import PageWrapper from "../../shared/PageWrapper";
import Button from "../../common/Button";
import InputEmail from "../../common/InputEmail";
import InputPassword from "../../common/InputPassword";
import Typography from "../../common/Typography";
import InputCheck from "../../common/InputCheck";
import LottieAnimation from "../../shared/LottieAnimation";
import personPortfolioShowAnimation from '../../../assets/animations/json/profile-portfolio-show-animation.json';
import checkingOnStandUpAnimation from '../../../assets/animations/json/checking-on-standup-animation.json';
import checkingComputerChattingAnimation from '../../../assets/animations/json/checking-computer-chatting-animation.json';
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import TypewriterComponent from "../../shared/Typewriter";
import Link from "../../common/Link";
import GoogleButton from "../../common/GoogleButton";
import GithubButton from "../../common/GithubButton";

const Signup: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string>('');
    const [password, setPassword] = useState('');
    const [agreeTerms, setAgreeTerms] = useState(false);

    const [msgBox, setMsgBox] = useState<MsgBox>({});
    const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
    const [isPending, setIsPending] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const [signup] = useUserSignupMutation();

    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    const showMsgBox = (txt: typeof msgBox.txt = '', type: typeof msgBox.type = 'danger') => {
        setMsgBox({ txt, type })
    }

    const handleSignup = useCallback(async (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        try {
            if (!navigator.onLine) return showMsgBox('No internet connection')

            if (disableSubmit) return;

            setIsPending(true);

            showMsgBox();
            setEmailError('');

            if (!name || !isValidFullName(name)) return showMsgBox('Enter a valid full name');

            if (!email || !isValidEmailAddress(email)) return setEmailError('Email is invalid');

            if (!password || !isValidPassword(password)) return showMsgBox('Enter a password of 8 characters containing uppercase, lowercase and digit');

            if (!agreeTerms) return showMsgBox('You must accept terms and service');

            const timer = setTimeout(() => setDisableSubmit(false), 4000);
            timerRef.current = timer;

            // Trying signup by server
            const { data: response, error } = await signup({ name, email, password }) || {};

            if (error) {
                const { data, error: errorMsg } = (error as APIErrorResponseTemplate)
                return showMsgBox(data?.message || errorMsg || 'Something went wrong');
            }

            const { message = '', status = 'Failed' } = response || {};
            if (status === 'Failed') return showMsgBox(message);

            showMsgBox(message, 'success');
        }
        catch (error) {
            console.error('--error', error)
            console.log('---------------error----------------')
            showMsgBox('Something went wrong, try again');
        }
        finally {
            setIsPending(false);
        }
    }, [disableSubmit, name, email, password, agreeTerms]);

    const sideBox =
        <div className="flex justify-center items-center w-full h-auto lg:w-[390px] lg:h-[370px] px-3 py-3 lg:py-1 rounded-[20px] order-1 md:order-[0]">
            <Swiper
                spaceBetween={50}
                slidesPerView={1}
                autoplay={{ delay: 4500 }}
                loop={true}
                modules={[Autoplay, Pagination]}
                className="rounded-xl overflow-hidden h-full"
            >
                <SwiperSlide>
                    <div className="transition-all w-full h-full flex flex-col items-center justify-between gap-1">
                        <LottieAnimation animationData={personPortfolioShowAnimation} style={{ width: 184, height: 184 }} />
                        <TypewriterComponent text={["Showcase yourself and be pro"]} />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="transition-all w-full h-full flex flex-col items-center justify-between gap-1">
                        <LottieAnimation animationData={checkingOnStandUpAnimation} />
                        <TypewriterComponent text={["Explore jobs, community etc"]} />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="transition-all w-full h-full flex flex-col items-center justify-between gap-1">
                        <LottieAnimation animationData={checkingComputerChattingAnimation} />
                        <TypewriterComponent text={["Others of your interest"]} />
                    </div>
                </SwiperSlide>
            </Swiper>
        </div >

    return (
        <PageWrapper>
            <AuthFormTemplate
                id="signup"
                title="Signup"
                sideBox={sideBox}
                msgBox={msgBox}
                bottomLinks={[
                    { prefix: 'Already have an account?', linkText: 'Login', pathname: '/auth/login' },
                ]}
            >
                <form
                    noValidate
                    onSubmit={handleSignup}
                    className="flex flex-col items-center justify-center gap-3"
                    method="POST"
                    role="form"
                    aria-label="form"
                >
                    <div className='w-full flex flex-col items-center justify-center gap-3 p-2'>
                        <div className="flex flex-col w-full gap-y-2">
                            <label htmlFor="name" className="w-full">
                                <Typography variant='p' className='ml-1 mb-0.5 h-5 font-medium' color='danger' role='alert'>&nbsp;</Typography>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    placeholder="Full name"
                                    value={name}
                                    onInput={e => {
                                        setName((e.target as HTMLInputElement).value);
                                        showMsgBox();
                                        setDisableSubmit(false);
                                    }}
                                    className="input-base input-md"
                                    autoFocus={true}
                                    required
                                />
                            </label>
                            <label htmlFor="email" className="w-full">
                                <Typography variant='p' className='ml-1 mb-0.5 h-5 font-medium' color='danger' role='alert'>&nbsp;{emailError}</Typography>
                                <InputEmail
                                    id="email"
                                    name='email'
                                    sz='md'
                                    col='light'
                                    placeholder='Email'
                                    value={email}
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
                                <Typography variant='p' className='ml-1 mb-0.5 h-5 font-medium' color='danger' role='alert'>&nbsp;</Typography>
                                <InputPassword
                                    id='password'
                                    name='password'
                                    sz='md'
                                    col='light'
                                    placeholder='Password'
                                    value={password}
                                    onInput={(ev) => {
                                        setPassword(ev.currentTarget.value);
                                        setDisableSubmit(false);
                                    }}
                                />
                            </label>
                        </div>
                        <div className="w-full ml-3 flex items-center">
                            <InputCheck
                                id='agreeTerms'
                                label='Accept terms and service'
                                defaultChecked={false}
                                name='agreeTerms'
                                col='dark'
                                sz='md'
                                rounded='full'
                                onChange={() => {
                                    setAgreeTerms(prev => !prev);
                                    setDisableSubmit(false);
                                }}
                            />
                            <Link
                                to='/terms-and-services'
                                target='_blank'
                                col="primary"
                                sz="xs"
                                className="underline"
                            >Terms and services</Link>
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
                        childrenOnLoading='Signing up'
                    >
                        Signup
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

export default Signup;
