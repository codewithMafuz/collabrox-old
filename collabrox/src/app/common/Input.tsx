type InputSize = 'sm' | 'md' | 'lg';
type InputColor = 'dark' | 'light' | 'primary' | 'danger' | 'success';
type InputRounded = 'sharp' | 'small' | 'half' | 'full';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    sz?: InputSize;
    col?: InputColor;
    rounded?: InputRounded;
    className?: string;
}

const Input = ({
    sz = 'md',
    col = 'light',
    rounded = 'full',
    className = '',
    ...props
}: InputProps) => {
    return (
        <div className='w-full relative'>
            <input
                {...props}
                className={`
                    input-base input-${sz} input-${col}
                    rounded-${rounded} ${className}
                    w-full
                `}
            />
        </div>
    );
};

export default Input;