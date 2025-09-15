import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import Button from './Button';
import { useUserGoogleSigninMutation } from '../../apis/userApi';
import { useNavigateCustom } from '../../hooks/useNavigateCustom';
import { setUserData } from '../pages/userSlice';
import { useDispatch } from 'react-redux';



const GoogleButtonContent = ({ setIsPending }: { setIsPending: any }) => {
    const dispatch = useDispatch()
    const navigate = useNavigateCustom()

    const [continueWithGoogle] = useUserGoogleSigninMutation()

    const login = useGoogleLogin({
        flow: 'auth-code',
        onSuccess: async ({ code }) => {
            setIsPending(true)
            try {
                const { data: response } = await continueWithGoogle({ code });
                const data = response?.data;

                if (data) {
                    dispatch(setUserData(data));
                    navigate({ url: `/${data.username}`, replace: true });
                }
            } catch (err) {
                console.error("Google login failed", err);
            } finally {
                setIsPending(false)
            }
        },
        onError: (errorResponse) => {
            console.error("Google login error :", errorResponse);
        },
    });

    return (
        <Button
            type="button"
            col='light'
            onClick={() => login()}
            tooltipProps={{
                content: 'Continue with Google',
                className: 'position-left',
                arrowClassName: 'rightside-middle',
            }}
            aria-label="Sign in with Google"
            className={`w-[32px] h-[32px] md:w-[36px] md:h-[36px] lg:w-[40px] lg:h-[40px] p-0`}
        >
            <FcGoogle className='w-[16px] md:w-[18px] lg:w-[20px] h-[16px] md:h-[18px] lg:h-[20px]' />
        </Button>
    )
}

const GoogleButton = ({ setIsPending }: { setIsPending: any }) => {
    return (
        <>
            <GoogleOAuthProvider clientId={(import.meta as any).env.VITE_GOOGLE_OAUTH_CLIENT_ID}>
                <GoogleButtonContent setIsPending={setIsPending} />
            </GoogleOAuthProvider>
        </>
    )
};

export default GoogleButton;