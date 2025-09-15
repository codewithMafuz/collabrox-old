import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";


/**
 * Navigate only if the provided URL is different from the current location.
 *
 * @param params.url - {string} The target URL to navigate to.
 * @param params.replace - {boolean}  Replace the current history entry (default: `false`).
 * @param params.state - {any} Optional state to pass during navigation.
 * @param params.checkSearchToo - {boolean} Compare search queries along with pathname (default: `false`).
 */
export const useNavigateCustom = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navigateIfNotAt = useCallback(
        ({
            url,
            replace = false,
            state,
            checkSearchToo = false,
        }: {
            url: string;
            replace?: boolean;
            state?: any;
            checkSearchToo?: boolean;
        }) => {
            const [targetPathname, targetSearch] = url.split("?");

            const { pathname: currentPathname, search: currentSearch } = location;

            const isPathnameDifferent = currentPathname !== targetPathname;
            const isSearchDifferent = checkSearchToo && currentSearch !== (targetSearch ? `?${targetSearch}` : "");

            if (isPathnameDifferent || isSearchDifferent) {
                navigate(url, { replace, state });
            }
        },
        [location]
    );

    return navigateIfNotAt;
};