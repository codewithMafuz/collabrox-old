import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { FaGithub } from "react-icons/fa";

import Button from "./Button";
import { useNavigateCustom } from "../../hooks/useNavigateCustom";
import { useUserGithubSigninMutation } from "../../apis/userApi";

function GithubButton({ setIsPending }: { setIsPending: any }) {
    const [githubSignin, { isLoading }] = useUserGithubSigninMutation();
    const location = useLocation();
    const navigate = useNavigateCustom();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');

        if (code) {
            (async () => {
                setIsPending(true)
                try {
                    const response = await githubSignin({ code }).unwrap();

                    if (response?.status) {
                        navigate({ url: '/', replace: true });
                    }
                } catch (error) {
                    console.error("GitHub login failed:", error);
                } finally {
                    setIsPending(false)
                }
            })();
        }
    }, [location.search, githubSignin, navigate]);

    return (
        <Button
            type="button"
            col="light"
            disabled={isLoading}
            onClick={() => {
                window.location.href = `https://github.com/login/oauth/authorize?client_id=${(import.meta as any).env.VITE_GITHUB_OAUTH_CLIENT_ID}`;
            }}
            tooltipProps={{
                content: 'Continue with GitHub',
                className: 'position-right',
                arrowClassName: 'leftside-middle',
            }}
            aria-label="Sign in with Github"
            className={`w-[32px] h-[32px] md:w-[36px] md:h-[36px] lg:w-[40px] lg:h-[40px] p-0`}
        >
            <FaGithub className="w-[16px] md:w-[18px] lg:w-[20px] h-[16px] md:h-[18px] lg:h-[20px]" />
        </Button>
    );
}

export default GithubButton;