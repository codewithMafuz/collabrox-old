import { useEffect, useState } from "react";
import WrapperButton, { TogglableButtonProps } from "./WrapperButton";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";

type ArrowButtonProps = TogglableButtonProps & {
    onClickOnDown?: () => void;
    onClickOnUp?: () => void;
    reverse?: boolean;
    col?: 'dark' | 'light' | 'primary' | 'success' | 'danger';
    sz?: 'ss' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    rounded?: 'sharp' | 'small' | 'half' | 'full';
};

const ButtonArrowUpDown: React.FC<ArrowButtonProps> = ({
    onToggle,
    onClickOnDown,
    onClickOnUp,
    initial,
    titles = [],
    reverse = false,
    col = 'primary',
    sz = 'md',
    rounded = 'full',
    className = "",
    ...props
}) => {
    const [show, setShow] = useState<boolean>(!!initial);
    
    useEffect(() => { setShow(!!initial) }, [initial]);

    return (
        <WrapperButton
            className={`icon-btn icon-btn-${sz} icon-btn-${col} rounded-${rounded} ${className}`}
            sz={sz}
            onClick={() => {
                onToggle?.();
                show ? onClickOnUp?.() : onClickOnDown?.();
                setShow(prev => !prev);
            }}
            title={show ? titles[1] || "Expand" : titles[0] || "Collapse"}
            {...props}
        >
            {reverse ? 
                (show ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />) : 
                (show ? <MdKeyboardArrowDown /> : <MdKeyboardArrowUp />)}
        </WrapperButton>
    );
};

export default ButtonArrowUpDown;