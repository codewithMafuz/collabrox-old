import { FaSpinner } from 'react-icons/fa';

export default function Spinner({ className = '', fontSize = '1rem' }: { className?: string; fontSize?: string }) {
    return (
        <FaSpinner
            className={`animate-spin text-primary-base drop-shadow-lg ${className}`}
            style={{ fontSize }}
        />
    );
};

