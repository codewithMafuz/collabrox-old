import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { classNames } from "../../lib/StringUtils";
import { RootState } from "../../store/store";
import { headerHeight } from "./Header";
import Footer from "./Footer";
import SimilarPersonItems from "./SimilarPersonItems";
import { ALL_ROUTES_REGEX } from "../../routes";
import LanguageSectionSidebar from "./LanguageSectionSidebar";

// Path configurations for different sections
export const leftWidthPercentagesConfig = [
    // Auth related paths
    { percent: 100, regex: ALL_ROUTES_REGEX['/auth/login'] },
    { percent: 100, regex: ALL_ROUTES_REGEX['/auth/signup'] },
    { percent: 100, regex: ALL_ROUTES_REGEX['/auth/complete-signup/:id/:token'] },
    { percent: 100, regex: ALL_ROUTES_REGEX['/terms-of-services'] }
] as const;

// Registered components configuration
const ALL_REGISTERED_COMPONENT = {
    'SimilarPersonItems': SimilarPersonItems,
    'LanguageSectionSidebar' : LanguageSectionSidebar,
};

export type ComponentId = keyof typeof ALL_REGISTERED_COMPONENT;

const Sidebar = () => {
    const { pathname } = useLocation();
    const { className, registeredComponentsConfig } = useSelector(
        (state: RootState) => state.sidebar
    );

    // Filter and sort components based on path pattern and position
    const matchedComponents = useMemo(() =>
        registeredComponentsConfig
            .filter(entry =>
                new RegExp(entry.pathPattern).test(pathname) &&
                entry.show
            )
            .sort((a, b) => a.positionIndex - b.positionIndex),
        [registeredComponentsConfig, pathname]
    );


    return (
        <div
            id="sidebar"
            style={{ marginTop: headerHeight }}
            className={classNames("bg-transparent w-full flex-col pt-1", className || '')}
        >
            {matchedComponents.map(comp => {
                const Component = ALL_REGISTERED_COMPONENT[comp.id];
                return <Component key={comp.id} {...comp.props} />;
            })}
            <Footer position="sticky" />
        </div>
    );
};

export default Sidebar;