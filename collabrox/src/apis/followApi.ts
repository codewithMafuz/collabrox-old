import { createApi } from "@reduxjs/toolkit/query/react";
import { APIResponseTemplate, fetchBaseQuerySetup } from "./userApi";

type GetListingData = {
    results: {
        _id: string;
        name: string;
        username: string;
        profileSrc?: string;
        bio?: string;
    }[],
    hasMore: boolean;

}

type GetListingProps = {
    username: string;
    cursor?: string | number;
    sortBy?: string;
    limit?: string;
};


export const followApi = createApi({
    reducerPath: "followApi",
    baseQuery: fetchBaseQuerySetup('/follow'),
    endpoints: (builder) => ({

        checkFollowingOfPerson: builder.query<APIResponseTemplate<{ isFollowing?: boolean }>, { targetPersonId: string }>({
            query: ({ targetPersonId }) => `/person/check-following/${targetPersonId}`,
        }),

        toggleFollowOfPerson: builder.mutation<APIResponseTemplate<{ isFollowing?: boolean }>, { targetPersonId: string }>({
            query: ({ targetPersonId }) => ({
                url: `/person/toggle/${targetPersonId}`,
                method: "POST",
            }),
        }),

        getFollowingsOfPerson: builder.query<APIResponseTemplate<GetListingData>, GetListingProps>({
            query: ({ username, ...params }) => ({
                url: `/person/${username}/followings`,
                params,
            }),
        }),

        getFollowersOfPerson: builder.query<APIResponseTemplate<GetListingData>, GetListingProps>({
            query: ({ username, ...params }) => ({
                url: `/person/${username}/followers`,
                params,
            }),
        }),

        searchFollowingsOfPerson: builder.query<APIResponseTemplate<{
            _id: string;
            name: string;
            username: string;
            profileSrc?: string;
            bio?: string;
            totalFollowers?: number;
            isFollowing?: boolean;
        }[]>, string>({
            query: (keyword) => `/person/search/followings/${keyword}`,
            keepUnusedDataFor: 0,
        }),

        searchFollowersOfPerson: builder.query<APIResponseTemplate<{
            _id: string;
            name: string;
            username: string;
            profileSrc?: string;
            bio?: string;
            totalFollowers?: number;
            isFollowing?: boolean;
        }[]>, string>({
            query: (keyword) => `/person/search/followers/${keyword}`,
            keepUnusedDataFor: 0,
        }),

    }),
});

export default followApi;

export const {
    useLazyCheckFollowingOfPersonQuery,
    useToggleFollowOfPersonMutation,
    useGetFollowingsOfPersonQuery,
    useGetFollowersOfPersonQuery,
    useLazySearchFollowingsOfPersonQuery,
    useLazySearchFollowersOfPersonQuery,
} = followApi;
