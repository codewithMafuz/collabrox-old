import React, { useEffect, useState, useCallback, useRef } from 'react';
import { APIErrorResponseTemplate, useUserSendResetPasswordEmailLinkMutation } from '../../../apis/userApi';
import { isValidEmailAddress } from '../../../services/validationServices';
import AuthFormTemplate, { MsgBox } from '../../shared/AuthFormTemplate';
import PageWrapper from '../../shared/PageWrapper';
import Button from '../../common/Button';
import InputEmail from '../../common/InputEmail';
import Typography from '../../common/Typography';
import LottieAnimation from '../../shared/LottieAnimation';
import SecurePulseAnimation from '../../../assets/animations/json/secure-pulse-animation.json';

const ForgetPassword: React.FC = () => {
    const [email, setEmail] = useState('');

    const [msgBox, setMsgBox] = useState<MsgBox>({});
    const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
    const [isPending, setIsPending] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const [forgotpassword] = useUserSendResetPasswordEmailLinkMutation();

    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    const showMsgBox = (txt: typeof msgBox.txt = '', type: typeof msgBox.type = 'danger') => {
        setMsgBox({ txt, type });
    };

    const handleForgetPasswordEmail = useCallback(async (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        try {
            if (!navigator.onLine) return showMsgBox('No internet connection')

            if (disableSubmit) return;

            setIsPending(true);

            showMsgBox();

            if (!email || !isValidEmailAddress(email)) return showMsgBox('Invalid email');

            const timer = setTimeout(() => setDisableSubmit(false), 4000);
            timerRef.current = timer;

            // Forgot password request to server
            const { data: response, error } = await forgotpassword({ email }) || {};

            if (error) {
                const { data, error: errorMsg } = (error as APIErrorResponseTemplate)
                return showMsgBox(data?.message || errorMsg || 'Something went wrong');
            }

            const { status = 'Failed', message } = response || {};
            if (status === 'Failed') return showMsgBox(message!);

            showMsgBox(message, 'success');
        }
        catch (error) {
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
            <Typography variant='title'>Forgot your password?</Typography>
        </div>

    return (
        <PageWrapper>
            <AuthFormTemplate
                id="forgetPassword"
                title="Forgot Password"
                backBtn={{ show: true }}
                sideBox={sideBox}
                msgBox={msgBox}
                bottomLinks={[
                    { prefix: '', linkText: 'Signup', pathname: '/auth/signup' },
                    { prefix: '', linkText: 'Login', pathname: '/auth/login' },
                ]}
            >
                <form
                    noValidate
                    onSubmit={handleForgetPasswordEmail}
                    className="flex flex-col items-center justify-center gap-3"
                    method="POST"
                    role="form"
                    aria-label="form"
                >
                    <div className='w-full flex flex-col items-center justify-center gap-3 p-2'>
                        <div className="flex flex-col w-full gap-y-2">
                            <label htmlFor="email" className="w-full">
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
                                    }}
                                />
                            </label>
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
                        childrenOnLoading='Sending'
                    >
                        Reset password
                    </Button>
                </form>
            </AuthFormTemplate>
        </PageWrapper>
    );
};

export default ForgetPassword;
