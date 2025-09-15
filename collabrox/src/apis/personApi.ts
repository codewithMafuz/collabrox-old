import { createApi } from "@reduxjs/toolkit/query/react";
import { APIResponseTemplate, fetchBaseQuerySetup } from "./userApi";

interface SkillReferences {
    experienceId: string;
    companyName: string;
    companyLogo?: string;
    companyId?: string;
};

export interface SkillItem {
    skillName: string;
    testScore: number;
    showScore: boolean;
    showExpRef: boolean;
    references?: SkillReferences[];
};

export type EmploymentType = 'Full-time' | 'Part-time' | 'Self-employed' | 'Freelance' | 'Contract' | 'Internship' | 'Apprenticeship' | 'Seasonal';
export type LocationType = 'Onsite' | 'Hybrid' | 'Remote';

export interface ExperienceRoleItem {
    roleIndex: number;
    titleOfRole: string;
    employmentType: EmploymentType;
    location: string;
    locationType: LocationType;
    summary?: string;
    fromDateMs: number;
    toDateMs?: number | 'Current';
    skills?: string[];
}

export interface ExperienceItem {
    experienceId?: string;
    companyName: string;
    companyLogo?: string;
    companyId?: string;
    roles: ExperienceRoleItem[];
}

export interface ExperiencePayload {
    experienceId?: string;
    companyName: string;
    companyId?: string;
    companyLogo?: string;
    titleOfRole: string;
    employmentType: string;
    location: string;
    locationType: string;
    summary?: string;
    fromDateMs: number;
    toDateMs?: number | 'Current';
    skills?: string[];
}

type PersonLocation = {
    country?: string;
    city?: string;
}

export type PersonItem<T = {}> = {
    isSelfProfile: boolean;
    _id: string;
    name: string;
    bio?: string;
    username: string;
    profileSrc?: string;
    profileSrcSm?: string;
    bannerSrc?: string;
    about?: string;
    location?: PersonLocation;
    skills?: SkillItem[];
    totalFollowers?: number;
    totalFollowings?: number;
    experiences?: ExperienceItem[];
    createdAt?: string;
    displayEmail?: string;
    github?: string;
    linkedin?: string;
    isFollowing?: boolean;
    languages: string[];
} & T;

export type UpdateSkillName = {
    oldSkillName: string;
    newSkillName?: string;
    testScore?: number;
    showScore?: boolean;
    showExpRef?: boolean;
}

export type GeneralDataProperties = Partial<{
    name: string;
    bio?: string;
    location?: { city?: string; country?: string };
    github?: string;
    linkedin?: string;
    displayEmail?: string;
}>


const personApi = createApi({
    reducerPath: "personApi",
    baseQuery: fetchBaseQuerySetup('/person'),
    endpoints: (builder) => ({
        getPersonItem: builder.query<APIResponseTemplate<PersonItem>, string>({
            query: (username) => `/${username}`,
            keepUnusedDataFor: 0,
        }),

        getSimilarPersonsItems: builder.query<APIResponseTemplate<PersonItem[]>, { username: string }>({
            query: ({ username }) => `/${username}/similarity`
        }),
        deletePersonBannerImage: builder.mutation<APIResponseTemplate, void>({
            query: () => ({
                url: '/image/banner/delete',
                method: 'DELETE',
            }),
        }),
        deletePersonProfileImage: builder.mutation<APIResponseTemplate, void>({
            query: () => ({
                url: '/image/profile/delete',
                method: 'DELETE',
            }),
        }),
        updateGeneralData: builder.mutation<APIResponseTemplate, GeneralDataProperties>({
            query: (data) => ({
                url: '/general-data/update',
                method: 'PATCH',
                body: data
            })
        }),

        getAbout: builder.query<APIResponseTemplate<{ about: string }>, { username: string }>({
            query: ({ username }) => `/${username}/about`
        }),

        updateAbout: builder.mutation<APIResponseTemplate<{ about: string }>, { about: string }>({
            query: ({ about }) => ({
                url: '/about/update',
                method: 'PATCH',
                body: { about }
            })
        }),

        getSkillsAndExperiences: builder.query<APIResponseTemplate<{ skills: any, experiences: any }>, { username: string }>({
            query: ({ username }) => `/${username}/skills-and-experiences`,
            keepUnusedDataFor: 30
        }),

        addSkill: builder.mutation<APIResponseTemplate<
            {
                skills: SkillItem[],
                experiences: ExperienceItem[]
            }>, SkillItem>({
                query: (skill) => ({
                    url: "/skill/add",
                    method: "POST",
                    body: { ...skill },
                }),
            }),

        updateSkillProperties: builder.mutation<APIResponseTemplate<
            {
                skills: SkillItem[],
                experiences: ExperienceItem[]
            }>, UpdateSkillName>({
                query: (skill) => ({
                    url: "/skill/update",
                    method: "PATCH",
                    body: { ...skill }
                }),
            }),
        removeSkill: builder.mutation<APIResponseTemplate<
            {
                skills: SkillItem[],
                experiences: ExperienceItem[]
            }>, { skillName: string }>({
                query: ({ skillName }) => ({
                    url: `/skill/remove/${skillName}`,
                    method: 'DELETE',
                }),
            }),

        addExperience: builder.mutation<APIResponseTemplate<
            {
                skills: SkillItem[],
                experiences: ExperienceItem[]
            }>, ExperiencePayload>({
                query: (experienceData) => ({
                    url: "/experience/add",
                    method: "POST",
                    body: experienceData,
                }),
            }),
        updateExperience: builder.mutation<APIResponseTemplate<
            {
                skills: SkillItem[],
                experiences: ExperienceItem[]
            }>, Partial<ExperiencePayload>>({
                query: (experienceData) => ({
                    url: `/experience/update`,
                    method: "PATCH",
                    body: experienceData,
                }),
            }),
        removeExperience: builder.mutation<APIResponseTemplate<
            {
                skills: SkillItem[],
                experiences: ExperienceItem[]
            }>,
            {
                experienceId: string,
                titleOfRole?: string,
                removeFromSkills?: boolean
            }
        >({
            query: ({ experienceId, titleOfRole, removeFromSkills }) => ({
                url: `/experience/remove`,
                method: "DELETE",
                body: { experienceId, titleOfRole, removeFromSkills },
            }),
        }),
    }),
});

export default personApi
export const {
    useLazyGetPersonItemQuery,
    useGetSimilarPersonsItemsQuery,
    useUpdateGeneralDataMutation,
    useDeletePersonBannerImageMutation,
    useDeletePersonProfileImageMutation,
    useGetAboutQuery,
    useUpdateAboutMutation,
    useGetSkillsAndExperiencesQuery,
    useAddSkillMutation,
    useUpdateSkillPropertiesMutation,
    useRemoveSkillMutation,
    useAddExperienceMutation,
    useUpdateExperienceMutation,
    useRemoveExperienceMutation,
} = personApi;