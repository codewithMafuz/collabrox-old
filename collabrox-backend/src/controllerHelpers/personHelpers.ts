import mongoose from "mongoose";
import { Experience, Role, Skill } from "../models/person.js";

interface ExperienceFormRequired {
    companyName: string;
    titleOfRole: string;
    location: string;
    locationType: string;
    employmentType: string;
    fromDateMs: number;
}

interface EnrichedSkill extends Skill {
    references?: {
        experienceId: string;
        companyName: string;
        companyLogo?: string;
        companyId?: string;
    }[]
}

export const isValidSkillName = (skillName?: string): boolean =>
    !!skillName?.trim() && skillName.trim().length >= 2 && skillName.trim().length <= 140;

export const isValidExperienceForm = (formBody: Partial<ExperienceFormRequired>): boolean =>
    !!formBody.companyName &&
    !!formBody.titleOfRole &&
    !!formBody.location &&
    !!formBody.locationType &&
    !!formBody.employmentType &&
    !!formBody.fromDateMs;

export const getSortableDate = (role: Partial<Role>) : {effectiveEnd : number, start : number} => ({
    effectiveEnd: role.toDateMs === 'Current' ? Infinity : role.toDateMs as number,
    start: role.fromDateMs as number
});

export const getEnrichSkillsWithExperienceRefs = (
    skills: Skill[],
    experiences: Experience[]
): EnrichedSkill[] => {
    if (!skills?.length || !experiences?.some(exp => exp.roles?.some(role => role.skills?.length))) {
        return skills || [];
    }

    return skills.map(skillDoc => {
        const skillObj = (skillDoc.toObject?.() || { ...skillDoc }) as Skill;
        if (!skillObj.showExpRef) return skillObj;

        const references: {
            experienceId: string,
            companyName: string,
            companyLogo?: string,
            companyId?: mongoose.Types.ObjectId
        }[] = [];
        experiences.forEach(exp => {
            const expObj = (exp.toObject?.() || { ...exp }) as Experience;
            expObj.roles?.forEach(role => {
                if (role.skills?.map(s => s.toLowerCase()).includes(skillObj.skillName.toLowerCase())) {
                    references.push({
                        experienceId: expObj.experienceId,
                        companyName: expObj.companyName,
                        companyLogo: expObj.companyLogo,
                        companyId: expObj?.companyId || undefined
                    });
                }
            });
        });

        return (references.length > 0 ? { ...skillObj, references } : skillObj) as EnrichedSkill;
    });
};

export const getSortedLatestExperiencesAndRoles = (
    userExperiences: Experience[]
): Experience[] => {
    if (!userExperiences?.length) return [];

    const experiences = userExperiences.map(exp => exp.toObject?.() || { ...exp });

    const withSortedRoles = experiences.map(experience => ({
        ...experience,
        roles: [...experience.roles].sort((a, b) => {
            const aDate = getSortableDate(a);
            const bDate = getSortableDate(b);
            return bDate.effectiveEnd - aDate.effectiveEnd || bDate.start - aDate.start;
        })
    }));

    return withSortedRoles.sort((a, b) => {
        if (!a.roles.length || !b.roles.length) return 0;
        const aDate = getSortableDate(a.roles[0]);
        const bDate = getSortableDate(b.roles[0]);
        return bDate.effectiveEnd - aDate.effectiveEnd ||
            bDate.start - aDate.start ||
            a.companyName.localeCompare(b.companyName);
    });
};