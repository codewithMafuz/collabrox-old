import { useEffect, useState } from "react";
import WrapperButton, { TogglableButtonProps } from "./WrapperButton";
import { FiEye, FiEyeOff } from "react-icons/fi";

type EyeButtonProps = TogglableButtonProps & {
    onClickOnEye?: () => void;
    onClickOnHidden?: () => void;
    reverse?: boolean;
    col?: 'dark' | 'light' | 'primary' | 'success' | 'danger';
    sz?: 'ss' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    rounded?: 'sharp' | 'small' | 'half' | 'full';
};

const ButtonEyeOnOff: React.FC<EyeButtonProps> = ({
    onToggle,
    onClickOnEye,
    onClickOnHidden,
    initial = true,
    titles = [],
    reverse = false,
    col = 'primary',
    sz = 'md',
    rounded = 'full',
    className = "",
    ...props
}) => {
    const [show, setShow] = useState<boolean>(initial);

    useEffect(() => { setShow(initial); }, [initial]);

    return (
        <WrapperButton
            className={`icon-btn icon-btn-${sz} icon-btn-${col} rounded-${rounded} ${className}`}
            sz={sz}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
                onToggle?.();
                show ? onClickOnHidden?.() : onClickOnEye?.();
                setShow(prev => !prev);
            }}
            title={show ? titles[1] || "Show" : titles[0] || "Hide"}
            {...props}
        >
            {reverse ? (
                show ? <FiEye /> : <FiEyeOff />
            ) : (
                show ? <FiEyeOff /> : <FiEye />
            )}
        </WrapperButton>
    );
};

export default ButtonEyeOnOff;
