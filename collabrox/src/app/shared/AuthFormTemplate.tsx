import { ReactNode, useState, useEffect } from "react";
import Logo from "../../assets/component-images/Logo";
import ButtonBack from "../common/ButtonBack";
import Link from "../common/Link";
import Typography from "../common/Typography";
import { Alert, AlertVariant } from "../common/Alert";

export type MsgBox = {
    txt?: string,
    type?: AlertVariant;
}

interface AuthFormTemplateProps {
    children: ReactNode;
    id?: string;
    sideBox?: ReactNode;
    title: string | ReactNode;
    msgBox: MsgBox;
    backBtn?: {
        show?: boolean;
        title?: string;
    };
    bottomLinks?: {
        pathname: string;
        prefix?: string;
        linkText?: string;
        replace?: boolean;
    }[]
}

const AuthFormTemplate = ({
    children,
    id,
    backBtn = { show: false },
    sideBox = null,
    title,
    msgBox = { type: 'danger' },
    bottomLinks = []
}: AuthFormTemplateProps) => {
    const [showAlert, setShowAlert] = useState(false);
    const [msgBoxKey, setMsgBoxKey] = useState(0);

    useEffect(() => {
        setShowAlert(false);
        setShowAlert(!!msgBox.txt);
        setMsgBoxKey(prev => prev + 1);
    }, [msgBox]);

    return (
        <div
            id={id}
            className={`w-full max-md:pb-20 flex flex-col gap-3 md:gap-2 lg:gap-1.5 items-center justify-start`}
        >
            {/* Logo Section */}
            <div className="">
                <Logo width={90} alt="logo-main-image" />
            </div>

            {/* Main Content Grid */}
            <div className="grid items-center grid-cols-[90vw] md:grid-cols-[320px_380px] lg:grid-cols-[340px_400px] grid-rows-[auto_auto] lg:grid-rows-[auto] gap-[50px] sm:gap-[20px] lg:gap-[60px] xl:gap-[70px] px-1 sm:px-2 md:px-3 lg:px-4 xl:px-5 lg:pt-0">
                {/* sideBox */}
                <div className="max-md:order-1">{sideBox}</div>

                {/* Form Container */}
                <div className="md:order-1 bg-light-base grid items-center justify-center w-full h-auto min-h-[500px] grid-rows-[50px_50px_auto_40px] grid-cols-[100%] dark:bg-dark-lighter px-1 py-0.5 shadow-lg rounded-[20px]">
                    {/* Title and Back Button */}
                    <div className="w-full relative">
                        <div className="flex-center">
                            <Typography variant="subheading" className="text-center">
                                {title}
                            </Typography>
                            {backBtn.show && (
                                <div className="absolute top-0 left-2 transition-all text-2xl">
                                    <ButtonBack
                                        tooltipConfig={{
                                            content: 'Back',
                                            className: 'position-top',
                                            arrowClassName: 'bottomside-middle',
                                        }}
                                        path={-1}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Top Alert Text */}
                    <div className="h-7">
                        {showAlert &&
                            <Alert
                                key={msgBoxKey}
                                title={msgBox?.txt || ''}
                                closeBtn={true}
                                className="animate-shake"
                                variant={msgBox?.type || 'danger'}
                                onClose={() => setShowAlert(false)}
                            />
                        }
                    </div>

                    {/* children (recommendation - `form` element) */}
                    {children}

                    {/* Bottom Links */}
                    {bottomLinks.length > 0 && (
                        <div
                            className={`w-full px-2 flex ${bottomLinks.length > 1
                                ? "justify-between"
                                : "justify-start"
                                }`}
                        >
                            {bottomLinks.map(
                                ({ pathname, linkText, prefix = '', replace = true }, index) => (
                                    <Typography
                                        key={index}
                                        variant="small"
                                        className=""
                                    >
                                        {prefix}
                                        <Link
                                            sz="sm"
                                            to={pathname}
                                            replace={replace}
                                        >
                                            {linkText || pathname}
                                        </Link>
                                    </Typography>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthFormTemplate;