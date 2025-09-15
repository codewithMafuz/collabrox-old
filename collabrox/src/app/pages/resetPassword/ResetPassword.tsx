import React, { useEffect, useState, useCallback, useRef } from 'react';
import { APIErrorResponseTemplate, useUserResetPasswordMutation } from '../../../apis/userApi';
import { isValidPassword } from '../../../services/validationServices';
import AuthFormTemplate, { MsgBox } from '../../shared/AuthFormTemplate';
import PageWrapper from '../../shared/PageWrapper';
import { useParams } from 'react-router-dom';
import { useNavigateCustom } from '../../../hooks/useNavigateCustom';
import Button from '../../common/Button';
import InputPassword from '../../common/InputPassword';
import Typography from '../../common/Typography';
import LottieAnimation from '../../shared/LottieAnimation';
import SecurePulseAnimation from '../../../assets/animations/json/secure-pulse-animation.json';

const ResetPassword: React.FC = () => {
    const navigate = useNavigateCustom();
    const { id = '', token = '' } = useParams();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [msgBox, setMsgBox] = useState<MsgBox>({});
    const [disableSubmit, setDisableSubmit] = useState<boolean>(true);
    const [isPending, setIsPending] = useState(false);

    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const [reset] = useUserResetPasswordMutation();

    useEffect(() => {
        return () => clearTimeout(timerRef.current);
    }, []);

    const showMsgBox = (txt: typeof msgBox.txt = '', type: typeof msgBox.type = 'danger') => {
        setMsgBox({ txt, type });
    };

    const handleReset = useCallback(async (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        try {
            if (!navigator.onLine) return showMsgBox('No internet connection')

            if (disableSubmit) return;

            setIsPending(true);

            showMsgBox();

            if (!isValidPassword(password)) return showMsgBox('Password must be at least 8 characters, contain uppercase, lowercase and digit');

            if (password !== confirmPassword) return showMsgBox('Passwords do not match');

            const timer = setTimeout(() => setDisableSubmit(false), 4000);
            timerRef.current = timer;

            // Reset password request to server
            const { data: response, error } = await reset({ password, confirmPassword, id, token }) || {};

            if (error) {
                const { data, error: errorMsg } = (error as APIErrorResponseTemplate)
                return showMsgBox(data?.message || errorMsg || 'Something went wrong');
            }

            const { message, status = 'Failed' } = response || {};
            if (status === 'Failed') return showMsgBox(message!);

            showMsgBox(message, 'success');
            setTimeout(() => {
                navigate({ url: '/auth/login', replace: true });
            }, 2000);
        }
        catch (error) {
            showMsgBox('Something went wrong, try again');
        }
        finally {
            setIsPending(false);
        }
    }, [disableSubmit, password, confirmPassword]);

    const sideBox =
        <div className="transition-all w-full h-full flex flex-col items-center justify-center gap-4">
            <LottieAnimation
                animationData={SecurePulseAnimation}
                style={{ width: 360, height: 360 }}
            />
            <Typography variant='title'>Reset your password</Typography>
        </div>

    return (
        <PageWrapper>
            <AuthFormTemplate
                id="resetPassword"
                title="Reset password"
                sideBox={sideBox}
                msgBox={msgBox}
                bottomLinks={[
                    { prefix: '', linkText: 'Login', pathname: '/auth/login', replace: false },
                ]}
            >
                <form
                    noValidate
                    onSubmit={handleReset}
                    className="flex flex-col items-center justify-center gap-3"
                    method="POST"
                    role="form"
                    aria-label="form"
                >
                    <div className='w-full flex flex-col items-center justify-center gap-3 p-2'>
                        <div className="flex flex-col w-full gap-y-4">
                            <label htmlFor="password" className="w-full">
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
                            <label htmlFor="confirmPassword" className="w-full">
                                <InputPassword
                                    id='confirmPassword'
                                    name='confirmPassword'
                                    sz='md'
                                    col='light'
                                    placeholder='Confirm password'
                                    value={confirmPassword}
                                    onInput={(ev) => {
                                        setConfirmPassword(ev.currentTarget.value);
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
                        childrenOnLoading='Resetting'
                    >
                        Confirm
                    </Button>
                </form>
            </AuthFormTemplate>
        </PageWrapper>
    );
};

export default ResetPassword;
