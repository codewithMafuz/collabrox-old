import { createApi } from "@reduxjs/toolkit/query/react";
import { APIResponseTemplate, fetchBaseQuerySetup } from "./userApi";
import { AllSearchCategories, SearchCategories } from "../app/pages/searchResults/SearchResults";
import { SearchHistoryItem } from "./historyApi";

export type PaginationResult = {
    results: any[];
    totalResults: number;
    totalPages: number;
}

export type SearchResultProps = {
    query: string;
    currentIds: string[];
    category: AllSearchCategories;
    page: number;
}

export type SearchResults = Record<SearchCategories, PaginationResult>

const searchApi = createApi({
    reducerPath: "searchApi",
    baseQuery: fetchBaseQuerySetup('/search'),
    endpoints: (builder) => ({
        getKeywordSuggestions: builder.query<APIResponseTemplate<SearchHistoryItem[]>, string>({
            query: (keyword) => `/suggestions/keyword/all/${keyword}`,
        }),

        getPersonSearchResults: builder.query<APIResponseTemplate<any>, { query: string; page?: string }>({
            query: ({ query, page }) => ({
                url: "/search/persons",
                params: { query, ...(page ? { page } : {}) }
            }),
        })
    }),
});

export default searchApi
export const {
    useLazyGetKeywordSuggestionsQuery,
    useLazyGetPersonSearchResultsQuery,
} = searchApi;