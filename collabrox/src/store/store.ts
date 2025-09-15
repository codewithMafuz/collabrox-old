import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "../apis/userApi";
import appSlice from "../appSlice";
import toastSlice from "../toastSlice";
import sidebarSlice from "../app/components/sidebarSlice";
import userSlice from "../app/pages/userSlice";
import personSlice from "../app/pages/person/personSlice";
import personApi from "../apis/personApi";
import searchApi from '../apis/searchApi';
import historyApi from "../apis/historyApi";
import followApi from "../apis/followApi";

const store = configureStore({
    reducer: {
        // State management and store
        appState: appSlice,
        toast: toastSlice,
        sidebar: sidebarSlice,
        user: userSlice,
        person: personSlice,

        // APIs and RTK queries
        [userApi.reducerPath]: userApi.reducer,
        [personApi.reducerPath]: personApi.reducer,
        [historyApi.reducerPath]: historyApi.reducer,
        [searchApi.reducerPath]: searchApi.reducer,
        [followApi.reducerPath]: followApi.reducer,

    },
    middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat(
            userApi.middleware,
            personApi.middleware,
            historyApi.middleware,
            searchApi.middleware,
            followApi.middleware,
        );
    },
});


/**
 * Get the redux state stored value by dot path | property name
 * @param path - example path : `state.user.name`
 * @returns Value of that path/property
 */
export const getStateValueByDotPath = (path: string) => {
    const state = store.getState()
    const pathArray = path.replace(/^state\./, '').split('.');
    return pathArray.reduce((acc, key) => (acc && key in acc ? (acc as Record<string, any>)[key] : undefined), state);
};
export default store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
