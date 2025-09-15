import { type ImgHTMLAttributes, memo, useEffect, useState } from 'react';
import logoAvif from '../../assets/logo/logo-text.avif';

const Logo = memo((props: ImgHTMLAttributes<HTMLImageElement>) => {

    return (
        <div id='logo-main-container'>
            <img
                src={logoAvif}
                alt="Application Logo"
                className='dark:invert-[85%] dark:hue-rotate-90 dark:saturate-120'
                {...props}
            />
        </div>
    );
});

export default Logo;