import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserVerifySignupCompletionQuery } from '../../../apis/userApi';
import TimerComponent from '../../shared/TimerComponent';
import PageWrapper from '../../shared/PageWrapper';
import ComponentWrapper from '../../common/ComponentWrapper';
import Link from '../../common/Link';
import Spinner from '../../common/Spinner';
import useShowToast from '../../../hooks/useShowToast';

const SignupComplete: React.FC = () => {
    const navigate = useNavigate();
    const showToast = useShowToast();

    const [error, setError] = useState<string>('');
    const { id, token } = useParams<{
        id: string;
        token: string;
    }>();

    const invalidToken =
        !id ||
        id.length !== 24 ||
        !token ||
        token.length < 20;

    const { data: response, isLoading, isError } = useUserVerifySignupCompletionQuery({ userId: id!, token: token! });

    console.log(response)

    useEffect(() => {
        if (invalidToken) {
            setError('Token unauthorized or expired');
        }
    }, [invalidToken]);

    useEffect(() => {
        if (isError && !isLoading && !error) {
            setError('Failed to complete signup, please try again');
        }
    }, [isError, isLoading, error]);

    useEffect(() => {
        if (response?.status === 'OK') {
            showToast('Successfully verified email', 'success');
        }
    }, [response]);

    return (
        <PageWrapper className="flex w-full min-h-screen items-center justify-center">
            <ComponentWrapper className="w-[360px] sm:w-[400px] lg:w-[600px] h-[500px] lg:h-[460px] p-3">
                <div className="h-[50%]">
                    {isLoading ? (
                        <Spinner fontSize="3rem" />
                    ) : (
                        <p
                            className={`font-[500] text-[1.2rem] sm:text-[1.25rem] tracking-wide ${response?.status === 'OK'
                                ? 'text-success-base'
                                : 'text-danger-base'
                                }`}
                        >
                            <span>
                                {response?.status === 'OK'
                                    ? 'Successfully verified email'
                                    : error || response?.message || 'Failed to complete signup, please try again'}
                            </span>
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-center justify-center">
                    <span className="text-indigo-500 text-[1.4rem] font-semibold">
                        Redirecting
                    </span>
                    <p className="text-indigo-500 text-[2rem] font-bold w-full text-center">
                        <TimerComponent
                            start={8}
                            onEndTime={() => navigate('/auth/login', { replace: true })}
                        />
                    </p>
                </div>

                <div className="h-[50%] flex items-center justify-center gap-x-5 text-indigo-500">
                    <Link
                        className="text-[1rem] hover:underline"
                        to="/auth/login"
                        replace={true}
                    >
                        Login
                    </Link>
                </div>
            </ComponentWrapper>
        </PageWrapper>
    );
};

export default SignupComplete;
