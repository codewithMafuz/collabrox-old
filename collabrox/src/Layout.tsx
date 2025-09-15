import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import Header, { headerHeight } from './app/components/Header';
import Sidebar from './app/components/Sidebar';
import Footer from './app/components/Footer';
import { CSSProperties, useMemo } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import SpinnerLoading from './app/common/Spinner';


interface LayoutProps {
    isLg: boolean;
    isRootPath?: boolean;
}

const Layout = ({ isLg, isRootPath = true }: LayoutProps) => {
    const { leftWidthPercentage, marginX } = useSelector((state: RootState) => state.appState);
    const loggedinUsername = useSelector((state: RootState) => state.user.username);

    // Determine visibility
    const isHideSidebar = useMemo(() => !leftWidthPercentage || leftWidthPercentage === 100, [leftWidthPercentage]);

    // calculative styling for main div
    const mainDivStyles: CSSProperties = useMemo(() => {
        const gapX = marginX ? 30 : 12; // gap between grid columns
        const marginLeftSide = (marginX ? 140 : 52) - (gapX / 2); // side margins each of both side
        const isSingleColumnLayout = leftWidthPercentage === 100 || !isLg; // is single side (one side) column layout
        return {
            width: isLg ? `calc(100% - ${marginLeftSide * 2}px)` : '100%',
            marginLeft: isLg ? marginLeftSide : 0,
            columnGap: gapX,
            gridTemplateColumns: isSingleColumnLayout
                ? '100%' // single-column layout
                : `calc(${leftWidthPercentage}% + ${gapX / 2}px) calc(${100 - leftWidthPercentage}% + ${gapX / 2}px)`, // two-sided (column) layout - value
        };
    }, [marginX, leftWidthPercentage, isLg]);

    return (
        <>
            {!isRootPath && <Header />}
            {
                isRootPath ?
                    <div className="flex items-center justify-center w-screen h-screen">
                        <SpinnerLoading fontSize='30px' />
                    </div>
                    :
                    <main
                        className="h-auto mr-auto grid lg:justify-center"
                        style={mainDivStyles}
                    >
                        <div className="w-full" style={{ marginTop: headerHeight }}>
                            <Outlet /> {/* Rendered Page */}
                        </div>
                        {!isHideSidebar && <Sidebar />}
                    </main>
            }
            {isHideSidebar && <Footer />}

        </>
    );
};

export default Layout;