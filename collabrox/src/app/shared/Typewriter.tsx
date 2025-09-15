import React from "react";
import { Typewriter } from "react-simple-typewriter";
import Typography, { type TypographyVariants } from "../common/Typography";

interface TypewriterProps {
    text: string[];
    loop?: boolean;
    delay?: number;
    cursor?: boolean;
    variant?: TypographyVariants;
}

const TypewriterComponent: React.FC<TypewriterProps> = ({
    text,
    loop = true,
    delay = 100,
    cursor = true,
    variant = 'subtitle'
}) => {
    return (
        <Typography variant={variant}>
            <Typewriter
                words={text}
                loop={loop}
                typeSpeed={delay}
                // deleteSpeed={80}
                cursor={cursor}
            />
        </Typography>
    );
};

export default TypewriterComponent;
