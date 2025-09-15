// Checks if the screen is hoverable
const isHoverableScreen = (): boolean => {
    return window.matchMedia('(hover: hover)')?.matches
        && window.matchMedia('(pointer: fine)')?.matches;
};

const scrollTop = (behavior: ScrollBehavior = 'smooth') => window.scrollTo({
    top: 0,
    left: 0,
    behavior,
});

// Search param utilities
const getRemovedSearchParamLocation = (keysToRemove: string[]): string => {
    const { pathname, search } = window.location;
    const params = new URLSearchParams(search);
    keysToRemove.forEach(key => params.delete(key));
    return `${pathname}${params.toString() ? `?${params}` : ''}`;
};

const getAddedSearchParamLocation = (paramsToAdd: [string, string][]): string => {
    const { pathname, search } = window.location;
    const params = new URLSearchParams(search);
    paramsToAdd.forEach(([key, value]) => params.set(key, value));
    return `${pathname}?${params}`;
};


export {
    isHoverableScreen,
    getRemovedSearchParamLocation,
    getAddedSearchParamLocation,
    scrollTop,
}