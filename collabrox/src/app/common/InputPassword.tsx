import { useState } from 'react';
import ButtonEyeOnOff from './ButtonEyeOnOff';

type InputSize = 'sm' | 'md' | 'lg';
type InputColor = 'dark' | 'light' | 'primary' | 'danger' | 'success';
type InputRounded = 'sharp' | 'small' | 'half' | 'full';

interface InputPasswordProps extends React.InputHTMLAttributes<HTMLInputElement> {
    sz?: InputSize;
    col?: InputColor;
    rounded?: InputRounded;
    className?: string;
}

const InputPassword = ({
    sz = 'md',
    col = 'light',
    rounded = 'full',
    className = '',
    ...props
}: InputPasswordProps) => {
    const [showPassword, setShowPassword] = useState<boolean>(false)

    return (
        <div className='w-full relative'>
            <input
                {...props}
                type={showPassword ? 'text' : 'password'}
                className={`
                    input-base input-${sz} input-${col}
                    rounded-${rounded} ${className}
                `}
            />
            <ButtonEyeOnOff
                sz={sz}
                col={col}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent"
                onToggle={() => setShowPassword(prev => !prev)}
            />
        </div>
    );
};

export default InputPassword;