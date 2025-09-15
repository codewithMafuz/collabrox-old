import { useNavigate } from "react-router-dom";
import WrapperButton, { ButtonProps } from "./WrapperButton";
import { MdOutlineArrowBack } from "react-icons/md";

interface ButtonBackProps extends ButtonProps {
    className?: string;
    path?: string | -1;
    replace?: boolean;
}

const ButtonBack: React.FC<ButtonBackProps> = ({
    path = '',
    className = "",
    replace = false,
    col = 'primary',
    sz = 'md',
    rounded = 'full',
    ...props
}) => {
    const navigate = useNavigate();

    return (
        <WrapperButton
            className={`icon-btn icon-btn-${sz} icon-btn-${col} rounded-${rounded} ${className}`}
            onClick={() => navigate(path as any, { replace })}
            {...props}
        >
            <MdOutlineArrowBack />
        </WrapperButton>
    );
};

export default ButtonBack;