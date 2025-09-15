import { ReactNode, useEffect, useRef } from 'react';
import Typography from '../common/Typography';
import { MdClose } from 'react-icons/md';
import BackgroundOverlayBox from '../common/BackgroundOverlayBox';
import ComponentWrapper from '../common/ComponentWrapper';
import { classNames } from '../../lib/StringUtils';

const QuickBox = ({
    show = true,
    children,
    onClose,
    topBarTitle = "View",
    allowScroll = true,
    innerBoxClassName = '',
    closeOnBlur = false,
    showTopBar = true,
}: {
    show?: boolean;
    children: ReactNode;
    onClose?: () => void;
    topBarTitle?: string;
    allowScroll?: boolean;
    innerBoxClassName?: string;
    closeOnBlur?: boolean;
    showTopBar?: boolean;
}) => {
    const boxRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (show) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.removeProperty('overflow')
        }
        return () => {
            document.body.style.removeProperty('overflow')
        }
    }, [show])

    useEffect(() => {
        if (closeOnBlur) {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as HTMLElement;
                if (
                    boxRef.current &&
                    !boxRef.current.contains(target) &&
                    !target.closest('.Toastify__toast-container, .Toastify__toast')
                ) {
                    onClose?.();
                }
            };

            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [closeOnBlur, onClose]);

    return (
        <div style={{ display: show ? 'unset' : 'none' }}>
            <BackgroundOverlayBox zIndex={999}>
                <ComponentWrapper
                    ref={boxRef}
                    className={classNames(
                        'relative z-[1000] rounded shadow-xl flex flex-col w-[390px] sm:w-[600px] md:w-[700px] lg:w-[960px] h-[80%] md:h-[90%] lg:h-[96%]',
                        innerBoxClassName
                    )}
                >
                    {/* Top bar */}
                    {showTopBar &&
                        <div className="sticky top-0 left-0 w-full bg-gray-200 flex justify-between items-center px-4 py-2 shadow-sm border-b border-gray-300">
                            <Typography variant="subheading" className="text-gray-900">
                                {topBarTitle}
                            </Typography>
                            <button
                                onClick={onClose}
                                className="flex items-center gap-2 p-2 text-gray-900 border border-gray-400 rounded-full hover:bg-gray-100"
                            >
                                <MdClose className="text-[1.3rem] text-gray-900" />
                            </button>
                        </div>}

                    {/* Content area */}
                    <div
                        className={classNames(
                            'flex-1 overflow-y-auto',
                            allowScroll ? 'custom-scrollbar-css-sm' : 'overflow-hidden'
                        )}
                    >
                        {children}
                    </div>
                </ComponentWrapper>
            </BackgroundOverlayBox>
        </div>
    );
};

export default QuickBox;
