import { Request, Response } from 'express';
import Follow from '../models/follow.js';
import sendTemplate from "../lib/templateHelpers.js";
import { bioSimilarityScore } from '../lib/functions.js'
import { getEnrichSkillsWithExperienceRefs, getSortedLatestExperiencesAndRoles, isValidExperienceForm, isValidSkillName } from '../controllerHelpers/personHelpers.js';
import { generateUniqueNumber } from "../lib/numberHelpers.js";
import Person, { EmploymentType, Experience, IPerson, LocationType, Role, Skill } from '../models/person.js';
import { toObjectId } from '../lib/mongooseHelper.js';
import {
    uploadToCloudinary,
    uploadProfileImageWithThumb,
    deleteFromCloudinary
} from '../config/cloudinaryConfig.js';
import { extractPublicIdFromUrl, generateCloudinaryPath } from '../lib/cloudinaryHelpers.js';
import User from '../models/user.js';
import formidable from 'formidable';
import fs from 'fs';

const form = formidable({
    multiples: false,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    keepExtensions: true,
});

// const formImage_ = formidable({
//     multiples: false,
//     maxFileSize: 10 * 1024 * 1024, // 10MB
//     keepExtensions: true,
//     allowEmptyFiles: false,
//     filter: (part) => part.mimetype?.startsWith('image/') || false
// });

// Request interfaces
interface GetPersonDataParams {
    username: string;
}

type UpdatePersonBody = Partial<IPerson>

interface UpdateAboutBody {
    about: string;
}

interface AddSkillBody {
    skillName: string;
    testScore?: number;
    showScore?: boolean;
    showExpRef?: boolean;
}

interface RemoveSkillParams {
    skillName: string;
}

interface UpdateSkillBody {
    oldSkillName: string;
    newSkillName: string;
    testScore?: number;
    showScore?: boolean;
    showExpRef?: boolean;
}

interface AddExperienceBody {
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

interface UpdateExperienceBody {
    experienceId: string;
    companyName?: string;
    companyId?: string;
    companyLogo?: string;
    roleIndex: number;
    titleOfRole?: string;
    employmentType?: string;
    location?: string;
    locationType?: string;
    summary?: string;
    fromDateMs?: number;
    toDateMs?: number | 'Current';
    skills?: string[];
}

interface RemoveExperienceBody {
    experienceId: string;
    titleOfRole?: string;
    removeFromSkills?: boolean;
}

class PersonController {
    static getPersonData = async (req: Request<GetPersonDataParams>, res: Response) => {
        try {
            const loggedinUser = req.user;

            const { username } = req.params;
            if (!(typeof username === 'string') || username.length < 2) return res.send(sendTemplate(false, "Invalid username"));

            const person = await Person.findOne({ username })
                .select('userId name username bio profileSrc profileSrcSm bannerSrc totalFollowers totalFollowings location github linkedin displayEmail languages')
                .lean()
                .exec();
            if (!person) return res.status(404).send(sendTemplate(false, "Person not found"));

            let isSelfProfile = false;
            if (loggedinUser && loggedinUser._id?.toString() === person.userId.toString()) {
                isSelfProfile = true;
            }

            const data = {
                isSelfProfile,
                isFollowing: loggedinUser && !isSelfProfile && await Follow.exists({ type: 'person', follower: loggedinUser._id, following: person._id }),
                ...person,
            };

            return res.status(200).send(sendTemplate(true, "Successful", data));
        } catch (error) {
            console.log(error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static updateGeneralData = async (req: Request<{}, {}, UpdatePersonBody>, res: Response) => {
        try {
            const { username } = req.user!;
            if (!username) return res.status(401).send(sendTemplate(false, "Unauthorized"));

            const { name, bio, location, github, linkedin, displayEmail } = req.body;

            if (bio && (typeof bio !== 'string' || bio.length > 200)) {
                return res.status(400).send(sendTemplate(false, "Invalid bio"));
            }

            const person = await Person.findOne({ username })
                .select('name bio profileSrc bannerSrc location github linkedin displayEmail')
                .exec();

            if (!person) {
                return res.status(404).send(sendTemplate(false, "Person not found"));
            }


            if (name && name.trim() !== person.name) {
                person.name = name.trim();
            }

            if (bio && bio.trim() !== person.bio) {
                person.bio = bio.trim();
            }

            if (location) {
                if (location.city && location.city.trim() !== person.location.city) {
                    person.location.city = location.city.trim();
                }
                if (location.country && location.country.trim() !== person.location.country) {
                    person.location.country = location.country.trim();
                }
            }

            if (github && github.trim() !== person.github) {
                person.github = github.trim();
            }

            if (linkedin && linkedin.trim() !== person.linkedin) {
                person.linkedin = linkedin.trim();
            }

            if (displayEmail && displayEmail.trim().toLowerCase() !== person.displayEmail) {
                person.displayEmail = displayEmail.trim().toLowerCase();
            }

            await person.save();

            return res.status(200).send(sendTemplate(true, "Updated successfully"));
        }
        catch (error) {
            console.error("Error in updating general info:", error);
            return res.status(500).send(sendTemplate(false));
        }
    }

    static getSimilarPersons = async (req: Request<{ username: string }, {}, {}, { limit?: string }>, res: Response) => {
        try {
            const { _id } = req.user!;
            const username = req.params.username;
            if (!(typeof username === 'string') || username.length < 2)
                return res.status(400).send(sendTemplate(false, "Invalid username"));

            const limit = req.query?.limit ? parseInt(req.query.limit) : 8;
            if (isNaN(limit) || limit < 1 || limit > 100)
                return res.status(400).send(sendTemplate(false, "Min limit is 1 and max limit is 100"));

            // Get the profile person (the reference for similarity)
            const profilePerson = await Person.findOne({ username })
                .select('username bio skills followingCompanies joinedCommunities')
                .lean()
                .exec();
            if (!profilePerson)
                return res.status(404).send(sendTemplate(false, "Person not found"));

            // getting similar persons result based on if person.about matches, or skills matches
            const finalResult = await Person.find({
                _id: { $ne: profilePerson._id }, // Exclude the profile person themselves
                userId: { $ne: _id }, // Exclude the logged-in user
                $or: [
                    // if skill name matches
                    { 'skills.skillName': { $in: (profilePerson.skills || []).map(s => s.skillName) } },
                    // or if about name  matches
                    ...(profilePerson.bio ? [{ bio: { $regex: new RegExp(profilePerson.bio, 'i') } }] : []),
                ],
                // limiting
            }).limit(limit).lean().exec();

            return res.status(200).send(sendTemplate(true, "Successful", finalResult));
        } catch (error) {
            console.log("Error in getting similar persons:", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static getAbout = async (req: Request, res: Response) => {
        try {
            const { username } = req.params;
            if (!(typeof username === 'string') || username.length < 2) return res.status(400).send(sendTemplate(false, "Invalid username"));

            const person = await Person.findOne({ username }).select('about').lean().exec();
            if (!person) return res.status(404).send(sendTemplate(false, "Person not found"));

            return res.status(200).send(sendTemplate(true, "Success", { about: person.about }));
        }
        catch (error) {
            console.log("Error in getting about:", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static updateAbout = async (req: Request<{}, {}, UpdateAboutBody>, res: Response) => {
        try {
            const { about } = req.body;
            if (!about) return res.status(400).send(sendTemplate(false, "Invalid about"));

            const updatedPerson = await Person.findOneAndUpdate({ username: req.user?.username },
                { about: about }, { new: true }
            );
            if (!updatedPerson) return res.status(404).send(sendTemplate(false, "Person not found"));

            return res.status(200).send(sendTemplate(true, 'Saved successfully', { about: updatedPerson.about }));
        } catch (error) {
            console.log('error in updateAbout :', error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static getSkillsAndExperiences = async (req: Request, res: Response) => {
        try {
            const { username } = req.params;
            if (!(typeof username === 'string') || username.length < 2) return res.send(sendTemplate(false, "Invalid username"));

            const person = await Person.findOne({ username }).select('skills experiences').lean().exec();
            if (!person) return res.send(sendTemplate(false, "Person not found"));

            const skills = person.skills || [];
            const experiences = person.experiences || [];

            const enrichedSkills = getEnrichSkillsWithExperienceRefs(skills, experiences);
            const sortedExperiences = getSortedLatestExperiencesAndRoles(experiences);

            return res.send(sendTemplate(true, "Success", { skills: enrichedSkills, experiences: sortedExperiences }));
        }
        catch (error) {
            console.log("Error in getting skills and experiences:", error);
            return res.status(500).send(sendTemplate(false));
        }
    }

    static addSkill = async (req: Request<{}, {}, AddSkillBody>, res: Response) => {
        try {
            const { skillName, testScore = 0, showScore = false, showExpRef = true } = req.body;

            const normalizedInput = skillName.trim().toLowerCase();
            if (!isValidSkillName(skillName)) return res.status(400).send(sendTemplate(false, "Invalid skill name"));

            const person = await Person.findOne({ username: req.user?.username });
            if (!person) return res.status(404).send(sendTemplate(false, "Person not found"));

            const exists = !!person.skills?.some(s => s.skillName.toLowerCase() === normalizedInput);
            if (exists) return res.status(200).send(sendTemplate(false, "Skill already exists"));

            person.skills?.push({
                skillName: skillName.trim(),
                testScore: Math.min(Math.max(testScore, 0), 100),
                showScore: !!showScore,
                showExpRef: !!showExpRef
            });

            const updatedPerson = await person.save();

            const data = {
                skills: updatedPerson.skills && updatedPerson.experiences ? getEnrichSkillsWithExperienceRefs(updatedPerson.skills, updatedPerson.experiences) : [],
                experiences: updatedPerson?.experiences || [],
            }

            return res.status(200).send(sendTemplate(true, "Skill added", data));

        } catch (error) {
            console.log("Error adding skill:", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static removeSkill = async (req: Request<RemoveSkillParams>, res: Response) => {
        try {
            const { skillName } = req.params;
            if (!(typeof skillName === 'string') || skillName.length < 2) return res.status(400).send(sendTemplate(false, "Invalid skill name"));

            const normalizedInput = skillName.toLowerCase();

            const person = await Person.findOne({ username: req.user?.username });
            if (!person) return res.status(404).send(sendTemplate(false, "Person not found"));

            const initialCount = person.skills?.length || 0;
            person.skills = person.skills?.filter(s =>
                s.skillName.toLowerCase() !== normalizedInput
            );

            if (person.skills?.length === initialCount) {
                return res.status(404).send(sendTemplate(false, "Skill not found"));
            }

            person.experiences = person.experiences?.map(experience => ({
                ...(experience?.toObject?.() || experience),
                roles: experience.roles.map(role => ({
                    ...(role?.toObject?.() || role),
                    skills: role.skills?.filter(s =>
                        s.trim().toLowerCase() !== normalizedInput
                    ) || []
                }))
            }));

            const updatedPerson = await person.save()

            const data = {
                skills: updatedPerson.skills && updatedPerson.experiences ? getEnrichSkillsWithExperienceRefs(updatedPerson.skills, updatedPerson.experiences) : [],
                experiences: updatedPerson?.experiences || [],
            }

            return res.status(200).send(sendTemplate(true, "Skill removed", data));

        } catch (error) {
            console.log("Error removing skill:", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static updateSkill = async (req: Request<{}, {}, UpdateSkillBody>, res: Response) => {
        try {
            const { oldSkillName, newSkillName, testScore, showScore, showExpRef } = req.body;

            const normalizedOld = oldSkillName.trim().toLowerCase();
            const normalizedNew = newSkillName.trim().toLowerCase();

            if (normalizedOld === normalizedNew && !testScore && showScore === undefined && showExpRef === undefined) return res.status(400).send(sendTemplate(false, "No changes made"));


            if (!isValidSkillName(newSkillName)) return res.status(400).send(sendTemplate(false, "Invalid new skill name"));

            const person = await Person.findOne({ username: req.user?.username });
            if (!person?.skills) return res.status(404).send(sendTemplate(false, `${person ? 'Skill' : 'Person'} not found`))


            const skillIndex = person.skills.findIndex(s =>
                s.skillName.toLowerCase() === normalizedOld
            ) || -1;

            if (skillIndex === -1) return res.status(400).send(sendTemplate(false, "Skill not found"));

            if (normalizedNew !== normalizedOld) {
                const exists = person.skills.some((s, index) =>
                    index !== skillIndex &&
                    s.skillName.toLowerCase() === normalizedNew
                ) || false;

                if (exists) return res.status(400).send(sendTemplate(false, "Skill already exists"));
            }

            const updatedSkill = {
                ...person.skills[skillIndex].toObject?.(),
                skillName: newSkillName.trim(),
                testScore: testScore !== undefined ?
                    Math.min(Math.max(testScore, 0), 100) :
                    person.skills[skillIndex].testScore,
                showScore: showScore !== undefined ? showScore : person.skills[skillIndex].showScore,
                showExpRef: showExpRef !== undefined ? showExpRef : person.skills[skillIndex].showExpRef
            };

            person.skills[skillIndex] = updatedSkill;

            if (person.experiences && normalizedOld !== normalizedNew) {
                person.experiences = person.experiences.map(experience => ({
                    ...(experience.toObject?.() || experience),
                    roles: experience.roles.map(role => ({
                        ...(role.toObject?.() || role),
                        skills: role?.skills?.map(s =>
                            s.trim().toLowerCase() === normalizedOld ?
                                newSkillName.trim() : s
                        ) || []
                    }))
                }));
            }

            const updatedPerson = await person.save();

            const data = {
                skills: updatedPerson.skills && updatedPerson.experiences ? getEnrichSkillsWithExperienceRefs(updatedPerson.skills, updatedPerson.experiences) : [],
                experiences: updatedPerson?.experiences || [],
            }

            return res.status(200).send(sendTemplate(true, "Skill updated", data));

        } catch (error) {
            console.log("Error updating skill:", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static addExperience = async (req: Request<{}, {}, AddExperienceBody>, res: Response) => {
        try {
            if (!isValidExperienceForm(req.body)) return res.status(400).send(sendTemplate(false, "Fill required fields"));

            const { companyName, companyId } = req.body;
            const normalizedCompanyName = companyName.trim().toLowerCase();

            const person = await Person.findOne({ username: req.user?.username });
            if (!person) return res.status(404).send(sendTemplate(false, "Person not found"))

            const roleSkills: string[] = req.body.skills || [];
            const newSkills: Skill[] = [];
            const existingSkillsLower = new Set(person.skills?.map(s => s.skillName.toLowerCase()) || []);

            if (person.skills) {
                for (let i = 0; i < roleSkills.length; i++) {
                    const skillName = roleSkills[i];

                    const trimmedSkill = skillName.trim();
                    if (!trimmedSkill || !isValidSkillName(trimmedSkill)) continue;

                    const normalizedSkill = trimmedSkill.toLowerCase();
                    const existingSkillIndex = person.skills.findIndex(s =>
                        s.skillName.toLowerCase() === normalizedSkill
                    ) || -1;

                    if (existingSkillIndex > -1) {
                        person.skills[existingSkillIndex].showExpRef = true;
                    } else {
                        if (!existingSkillsLower.has(normalizedSkill)) {
                            newSkills.push({
                                skillName: trimmedSkill,
                                testScore: 0,
                                showScore: false,
                                showExpRef: true
                            });
                            existingSkillsLower.add(normalizedSkill);
                        }
                    }
                }
            }

            person.skills?.push(...newSkills)

            const newRoleItem: Role = {
                titleOfRole: req.body.titleOfRole,
                employmentType: req.body.employmentType as EmploymentType,
                location: req.body.location,
                locationType: req.body.locationType as LocationType,
                summary: req.body.summary || '',
                fromDateMs: req.body.fromDateMs,
                toDateMs: req.body.toDateMs || 'Current',
                skills: roleSkills.map(s => s.trim())
            };

            const existedExperience = person.experiences?.find(e =>
                (companyId && e.companyId?.toString() === companyId.toString()) ||
                e.companyName.trim().toLowerCase() === normalizedCompanyName
            );

            if (existedExperience) {
                existedExperience.roles.unshift(newRoleItem);
            } else {
                const newExperienceObj: Experience = {
                    experienceId: generateUniqueNumber().toString(),
                    companyId: undefined,
                    companyName: req.body.companyName.trim(),
                    companyLogo: '',
                    roles: [newRoleItem]
                };
                person.experiences?.unshift(newExperienceObj);
            }

            const updatedPerson = await person.save();

            const data = {
                skills: updatedPerson.skills && updatedPerson.experiences ? getEnrichSkillsWithExperienceRefs(updatedPerson.skills, updatedPerson.experiences) : [],
                experiences: updatedPerson?.experiences || [],
            }

            return res.status(200).send(sendTemplate(true, "Experience added", data));
        } catch (error) {
            console.error("Error adding experience:", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static updateExperience = async (req: Request<{}, {}, UpdateExperienceBody>, res: Response) => {
        try {
            const { experienceId,
                companyName,
                companyLogo,
                companyId,
                roleIndex,
                ...roleUpdates } = req.body;
            if (!experienceId || !roleIndex) return res.status(400).send(sendTemplate(false, "Fill required fields"));

            const person = await Person.findOne({ username: req.user?.username });
            if (!person) return res.status(404).send(sendTemplate(false, 'Person not found'))

            const expIndex = person.experiences?.findIndex(e => e.experienceId === experienceId) || -1;
            if (expIndex === -1) return res.status(404).send(sendTemplate(false, "Experience not found"))

            if (!person.experiences || roleIndex >= person.experiences[expIndex]?.roles?.length) {
                return res.status(404).send(sendTemplate(false, "Experience or role not found"));
            }

            const experience = person.experiences[expIndex];
            const role = experience.roles[roleIndex];

            const oldSkills = role.skills || [];
            const newSkills = roleUpdates.skills?.map(s => s.trim()) || oldSkills;
            const oldLower = oldSkills.map(s => s.toLowerCase());

            if (person.skills) {
                for (let i = 0; i < newSkills.length; i++) {
                    const skill = newSkills[i]
                    if (!oldLower.includes(skill.toLowerCase())) {
                        const normalized = skill.trim().toLowerCase();
                        const existingSkillIndex = person.skills.findIndex(s =>
                            s.skillName.toLowerCase() === normalized
                        );

                        if (existingSkillIndex > -1) {
                            person.skills[existingSkillIndex].showExpRef = true;
                        } else {
                            person.skills.push({
                                skillName: skill.trim(),
                                testScore: 0,
                                showScore: false,
                                showExpRef: true
                            });
                        }
                    }
                }
            }

            if (companyName) experience.companyName = companyName;
            if (companyId) experience.companyId = toObjectId(companyId);
            if (companyLogo) experience.companyLogo = companyLogo;

            Object.assign(role, roleUpdates);
            role.skills = newSkills;

            const updatedPerson = await person.save();

            const data = {
                skills: updatedPerson.skills && updatedPerson.experiences ? getEnrichSkillsWithExperienceRefs(updatedPerson.skills, updatedPerson.experiences) : [],
                experiences: updatedPerson?.experiences || [],
            }

            return res.status(200).send(sendTemplate(true, "Experience updated", data));

        } catch (error) {
            console.error("[Experience Update Error]", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static removeExperience = async (req: Request<{}, {}, RemoveExperienceBody>, res: Response) => {
        try {
            const { experienceId, titleOfRole, removeFromSkills } = req.body;

            const person = await Person.findOne({ username: req.user?.username });
            if (!person) return res.status(404).send(sendTemplate(false, "Person not found"));

            const expIndex = person.experiences?.findIndex(e => e.experienceId === experienceId) || -1;
            if (expIndex === -1) return res.status(404).send(sendTemplate(false, "Experience not found"));

            const experience = person.experiences?.[expIndex];

            let removedSkills: string[] = [];
            if (titleOfRole?.trim()) {
                const targetTitle = titleOfRole.trim().toLowerCase();
                const originalRoles = experience?.roles || [];

                if (experience) {
                    experience.roles = originalRoles.filter(role =>
                        role.titleOfRole.trim().toLowerCase() !== targetTitle
                    );
                }

                const removedRoles = originalRoles.filter(role =>
                    role.titleOfRole.trim().toLowerCase() === targetTitle
                );
                removedSkills = removedRoles.flatMap(role => role.skills || []);

                if (!experience?.roles || experience.roles.length === 0) person.experiences?.splice(expIndex, 1);
            } else {
                if (experience?.roles) {
                    removedSkills = experience.roles.flatMap(role => role.skills || []);
                }
                person.experiences?.splice(expIndex, 1);
            }

            if (removeFromSkills && removedSkills.length > 0) {
                const normalizedRemoved = removedSkills.map(s => s.trim().toLowerCase());

                const usedSkills = new Set();
                person.experiences?.forEach(exp =>
                    exp.roles.forEach(role =>
                        (role.skills || []).forEach(skill =>
                            usedSkills.add(skill.trim().toLowerCase())
                        )
                    )
                );

                const unusedSkills = normalizedRemoved.filter(skill =>
                    !usedSkills.has(skill)
                );

                person.skills = person.skills?.filter(skillObj =>
                    !unusedSkills.includes(skillObj.skillName.trim().toLowerCase())
                );
            }

            const updatedPerson = await person.save();

            const data = {
                skills: updatedPerson.skills && updatedPerson.experiences ? getEnrichSkillsWithExperienceRefs(updatedPerson.skills, updatedPerson.experiences) : [],
                experiences: updatedPerson?.experiences || [],
            }
            return res.status(200).send(sendTemplate(true, "Experience removed", data))

        } catch (error) {
            console.error("[Experience Removal Error]", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static updatePersonBannerImage = async (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const sendSSEStream = (progress: number, stage: string, message: string, data?: object) => {
            res.write(`data: ${JSON.stringify({ progress, stage, message, ...data })}\n\n`);
        };

        form.parse(req, async (err, fields, files) => {
            let tempFilePath: string | null = null;
            try {
                if (err) throw new Error('Form parsing failed');

                const file = files.bannerImage?.[0];
                if (!file || !file.filepath) throw new Error('No valid file uploaded');

                tempFilePath = file.filepath;
                sendSSEStream(20, 'Processing', 'Reading image');

                const imageBuffer = fs.readFileSync(tempFilePath);

                const userId = req.user!._id;

                // Generate unique filename with timestamp
                const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
                const public_id = generateCloudinaryPath(
                    userId!.toString(),
                    'images',
                    'Person',
                    'Banner',
                    `banner_${timestamp}`
                );

                sendSSEStream(40, 'Uploading', 'Uploading image to Cloudinary');
                const uploadBannerRes = await uploadToCloudinary(imageBuffer, public_id, false);

                if (uploadBannerRes.status !== 'OK') throw new Error(`Upload failed: ${uploadBannerRes.msg}`);

                // Delete old banner if exists
                const person = await Person.findOne({ userId });
                if (person && person.bannerSrc) {
                    const oldPublicId = extractPublicIdFromUrl(person.bannerSrc);
                    if (oldPublicId) {
                        await deleteFromCloudinary(oldPublicId);
                    }
                }

                sendSSEStream(90, 'Saving', 'Saving to database');
                await Person.updateOne(
                    { userId },
                    { bannerSrc: uploadBannerRes.srcURL! }
                );

                sendSSEStream(100, 'Successful', 'Banner updated successfully', { bannerSrc: uploadBannerRes.srcURL });
            } catch (error: any) {
                console.log('Error updating banner:', error);
                sendSSEStream(0, 'Error', error?.message || 'Upload failed');
            } finally {
                if (tempFilePath) {
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (unlinkError) {
                        console.error('Error deleting temp file:', unlinkError);
                    }
                }
            }
        });
    };

    static updatePersonProfileImage = async (req: Request, res: Response) => {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const sendSSEStream = (progress: number, stage: string, message: string, data?: object) => {
            res.write(`data: ${JSON.stringify({ progress, stage, message, ...data })}\n\n`);
        };

        form.parse(req, async (err, fields, files) => {
            let tempFilePath: string | null = null;
            try {
                if (err) throw new Error('Form parsing failed');

                const file = files.profileImage?.[0];
                if (!file || !file.filepath) throw new Error('No valid file uploaded');

                tempFilePath = file.filepath;
                sendSSEStream(20, 'Processing', 'Reading image');

                const imageBuffer = fs.readFileSync(tempFilePath);

                const userId = req.user!._id;

                // Generate unique filename with timestamp
                const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
                const public_id = generateCloudinaryPath(
                    userId!.toString(),
                    'images',
                    'Person',
                    'Profile',
                    `profile_${timestamp}`
                );

                sendSSEStream(50, 'Uploading', 'Uploading and transforming image...');
                const uploadResult = await uploadProfileImageWithThumb(imageBuffer, public_id);

                if (uploadResult.status !== 'OK' || !uploadResult.profileSrc || !uploadResult.profileSrcSm) {
                    throw new Error(uploadResult.msg);
                }

                // Delete old profile images if exist
                const person = await Person.findOne({ userId });
                if (person) {
                    if (person.profileSrc) {
                        const oldPublicId = extractPublicIdFromUrl(person.profileSrc);
                        if (oldPublicId) {
                            await deleteFromCloudinary(oldPublicId);
                        }
                    }
                    if (person.profileSrcSm) {
                        const oldThumbPublicId = extractPublicIdFromUrl(person.profileSrcSm);
                        if (oldThumbPublicId) {
                            await deleteFromCloudinary(oldThumbPublicId);
                        }
                    }
                }

                sendSSEStream(90, 'Saving', 'Saving to database');

                await Person.updateOne(
                    { userId },
                    {
                        profileSrc: uploadResult.profileSrc,
                        profileSrcSm: uploadResult.profileSrcSm,
                    }
                );

                await User.updateOne(
                    { _id: userId },
                    { profileSrcSm: uploadResult.profileSrcSm }
                );

                sendSSEStream(100, 'Successful', 'Profile updated successfully', {
                    profileSrc: uploadResult.profileSrc,
                    profileSrcSm: uploadResult.profileSrcSm
                });

            } catch (error: any) {
                console.log('Error updating profile:', error);
                sendSSEStream(0, 'Error', error?.message || 'Upload failed');
            } finally {
                if (tempFilePath) {
                    try {
                        fs.unlinkSync(tempFilePath);
                    } catch (unlinkError) {
                        console.error('Error deleting temp file:', unlinkError);
                    }
                }
            }
        });
    };

    static deletePersonBannerImage = async (req: Request, res: Response) => {
        try {
            const person = await Person.findOne({ username: req.user!.username });
            if (!person) return res.status(404).send(sendTemplate(false, "Person not found"));

            if (person.bannerSrc) {
                const publicId = extractPublicIdFromUrl(person.bannerSrc);
                if (publicId) {
                    await deleteFromCloudinary(publicId);
                }
            }

            person.bannerSrc = undefined;
            await person.save();

            return res.status(200).send(sendTemplate(true, "Banner image removed"));
        } catch (error) {
            console.error("Error deleting person banner image:", error);
            return res.status(500).send(sendTemplate(false, "Failed to remove banner image"));
        }
    };

    static deletePersonProfileImage = async (req: Request, res: Response) => {
        try {
            const person = await Person.findOne({ username: req.user!.username });
            if (!person) return res.status(404).send(sendTemplate(false, "Person not found"));

            if (person.profileSrc) {
                const publicId = extractPublicIdFromUrl(person.profileSrc);
                if (publicId) {
                    await deleteFromCloudinary(publicId);
                }
            }

            if (person.profileSrcSm) {
                const thumbPublicId = extractPublicIdFromUrl(person.profileSrcSm);
                if (thumbPublicId) {
                    await deleteFromCloudinary(thumbPublicId);
                }
            }

            await User.updateOne({ _id: person.userId }, { $unset: { profileSrcSm: 1 } });

            person.profileSrc = undefined;
            person.profileSrcSm = undefined;
            await person.save();

            return res.status(200).send(sendTemplate(true, "Profile image removed"));
        } catch (error) {
            console.error("Error deleting person profile image:", error);
            return res.status(500).send(sendTemplate(false, "Failed to remove profile image"));
        }
    };

    static addPersonProfileLanguage = async (req: Request<{}, {}, { language: string }>, res: Response) => {
        try {
            const { language } = req.body;
            if (!language || typeof language !== 'string' || language.trim().length < 2) {
                return res.status(400).send(sendTemplate(false, "Invalid language"));
            }
            const normalizedLang = language.trim().toLowerCase();

            const person = await Person.findOne({ username: req.user?.username });

            const exists = person!.languages?.some(lang => lang.toLowerCase() === normalizedLang) || false;
            if (exists) return res.status(200).send(sendTemplate(false, "Language already exists"));
            person!.languages?.push(language.trim());
            await person!.save();
            return res.status(200).send(sendTemplate(true, "Language added", { languages: person!.languages || [] }));
        }
        catch (error) {
            console.error("Error adding language:", error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    static removePersonProfileLanguage = async (req: Request<{ language: string }>, res: Response) => {
        try {
            const { language } = req.params;
            if (!language || typeof language !== 'string' || language.trim().length < 2) {
                return res.status(400).send(sendTemplate(false, "Invalid language"));
            }
            const normalizedLang = language.trim().toLowerCase();
            const person = await Person.findOne({ username: req.user?.username });

            const initialCount = person!.languages?.length || 0;
            person!.languages = person!.languages?.filter(lang => lang.toLowerCase() !== normalizedLang);
            if ((person!.languages?.length || 0) === initialCount) {
                return res.status(404).send(sendTemplate(false, "Language not found"));
            }
            await person!.save();
            return res.status(200).send(sendTemplate(true, "Language removed", { languages: person!.languages || [] }));
        }
        catch (error) {
            console.error("Error removing language:", error);
            return res.status(500).send(sendTemplate(false));
        }
    };
}

export default PersonController;