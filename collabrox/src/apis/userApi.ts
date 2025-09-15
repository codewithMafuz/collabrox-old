// userApi.ts
import axios from 'axios'
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const COLLABROX_BASE_API = (import.meta as any).env.VITE_COLLABROX_BASE_API;

export const axiosInstance = axios.create({
    baseURL: COLLABROX_BASE_API,
    withCredentials: true,
    headers: {
        "Accept": "application/json"
    }
});


/**
 * @param `T` - means `response.data` properties | not given means null
 */
export interface APIResponseTemplate<T = any> {
    status: 'OK' | 'Failed';
    message: string | 'Successful' | 'Failed';
    data: T | null;
}

export interface APIErrorResponseTemplate {
    data?: {
        data: any;
        message: string;
        status: 'OK' | 'Failed';
    },
    error?: string;
}

export type UserRole = 'user' | 'admin' | 'recruiter';

export interface User {
    _id: string;
    name: string;
    username: string;
    email: string;
    googleId?: string;
    role: UserRole;
    bio: string;
    profileSrcSm?: string;
    personId?: string;
}

export type UserExceptSensitive = Partial<Omit<User, '_id' | 'googleId' | 'personId'>>;

export const fetchBaseQuerySetup = (endpointPrefix: string) => fetchBaseQuery({
    baseUrl: (import.meta as any).env.VITE_COLLABROX_BASE_API + endpointPrefix,
    credentials: 'include',
});

export const isUsername = (username: string | undefined) => username && username.length >= 8 && username.length <= 120

export const userApi = createApi({
    reducerPath: "userApi",
    baseQuery: fetchBaseQuerySetup('/user'),
    endpoints: (builder) => ({
        // --- Auth endpoints ---
        userSignup: builder.mutation<APIResponseTemplate<{ email: string }>, { name: string, email: string, password: string }>({
            query: ({ name, email, password }) => ({
                url: "/signup",
                method: "POST",
                body: { name, email, password },
            }),
        }),
        userVerifySignupCompletion: builder.query<APIResponseTemplate, { userId: string, token: string }>({
            query: ({ userId, token }) => `/verify-signup/${userId}/${token}`
        }),
        userLogin: builder.mutation<APIResponseTemplate<User>, { email: string, password: string }>({
            query: ({ email, password }) => ({
                url: "/login",
                method: "POST",
                body: { email, password },
            }),
        }),
        userGoogleSignin: builder.mutation<APIResponseTemplate<User>, { code: string }>({
            query: ({ code }) => ({
                url: "/google-signin",
                method: "POST",
                body: { code }
            }),
        }),
        userGithubSignin: builder.mutation<APIResponseTemplate<User>, { code: string }>({
            query: ({ code }) => ({
                url: "/github-signin",
                method: "POST",
                body: { code },
            }),
        }),
        userSendResetPasswordEmailLink: builder.mutation<APIResponseTemplate, { email: string }>({
            query: ({ email }) => ({
                url: "/send-reset-password-email-link",
                method: "POST",
                body: { email },
            }),
        }),
        userResetPassword: builder.mutation<APIResponseTemplate, { password: string, confirmPassword: string, id: string; token: string }>({
            query: ({ password, confirmPassword, id, token }) => ({
                url: "/reset-password",
                method: "POST",
                body: { password, confirmPassword, id, token },
            }),
        }),
        userChangePassword: builder.mutation<APIResponseTemplate, { password: string, newPassword: string }>({
            query: ({ password, newPassword }) => ({
                url: "/change/password",
                method: "PATCH",
                body: { password, newPassword },
            }),
        }),
        userLogout: builder.mutation<APIResponseTemplate, void>({
            query: () => ({
                url: '/logout',
                method: "POST",
            }),
        }),

        // --- User management endpoints ---
        userLoggedIn: builder.query<APIResponseTemplate<User>, string>({
            query: (pathname = '') => '/loggedin',
            keepUnusedDataFor: 0,
        }),
        userDeleteAccount: builder.mutation<APIResponseTemplate, { password: string }>({
            query: ({ password }) => ({
                url: "/delete",
                method: "DELETE",
                body: { password },
            }),
        }),
    }),
});

export const {
    useUserSignupMutation,
    useUserVerifySignupCompletionQuery,
    useUserLoginMutation,
    useUserGoogleSigninMutation,
    useUserGithubSigninMutation,
    useUserSendResetPasswordEmailLinkMutation,
    useUserResetPasswordMutation,
    useUserChangePasswordMutation,
    useUserLogoutMutation,

    useUserLoggedInQuery,
    useUserDeleteAccountMutation,
} = userApi;
