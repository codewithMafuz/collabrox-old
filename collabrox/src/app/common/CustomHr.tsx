import { classNames } from "../../lib/StringUtils";

const CustomHr = ({
    className = '',
    variant = 'thin'
}: {
    className?: string;
    variant?: 'normal' | 'thin'
}) => {
    return (
        <div
            className={classNames(
                'block w-full bg-gray-300',
                variant === 'thin' ? 'h-[1px]' : 'h-[2px]',
                className,
            )}
        />
    );
}

export default CustomHr
