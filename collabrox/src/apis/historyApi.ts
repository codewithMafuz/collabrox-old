import { createApi } from "@reduxjs/toolkit/query/react";
import { APIResponseTemplate, fetchBaseQuerySetup } from "./userApi";

export interface SearchHistoryItem {
    uniqueId: string;
    name: string;
    username?: string;
    companyId?: string;
    jobId?: string;
    communityId?: string;
    isSearchHistory?: boolean;
}

const historyApi = createApi({
    reducerPath: "historyApi",
    baseQuery: fetchBaseQuerySetup('/history'),
    endpoints: (builder) => ({
        searchHistory: builder.query<APIResponseTemplate<SearchHistoryItem[]>, void>({
            query: () => ({
                url: "/search"
            }),
        }),
        addSearchHistory: builder.mutation<APIResponseTemplate, SearchHistoryItem>({
            query: (searchHistoryNewObj) => ({
                url: "/search/add",
                method: "POST",
                body: { searchHistoryNewObj }
            }),
        }),
        removeSearchHistory: builder.mutation<APIResponseTemplate, { uniqueId: string }>({
            query: ({ uniqueId }) => ({
                url: `/search/remove/${uniqueId}`,
                method: "DELETE",
            }),
        }),
        clearSearchHistory: builder.mutation<APIResponseTemplate, void>({
            query: () => ({
                url: "/search/clear",
                method: "DELETE",
            }),
        }),
    }),
});

export default historyApi
export const {
    useLazySearchHistoryQuery,
    useAddSearchHistoryMutation,
    useRemoveSearchHistoryMutation,
    useClearSearchHistoryMutation,
} = historyApi;