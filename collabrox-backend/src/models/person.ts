import mongoose, { Document, Schema } from 'mongoose';

export type EmploymentType =
    | "Full-time"
    | "Part-time"
    | "Self-employed"
    | "Freelance"
    | "Contract"
    | "Internship"
    | "Apprenticeship"
    | "Seasonal";

export type LocationType = "Onsite" | "Hybrid" | "Remote";

export interface Skill {
    toObject?: () => Skill;
    skillName: string;
    testScore?: number;
    showScore?: boolean;
    showExpRef?: boolean;
}

export interface Role {
    titleOfRole: string;
    employmentType: EmploymentType;
    location: string;
    locationType: LocationType;
    summary?: string;
    fromDateMs: number;
    toDateMs?: number | "Current";
    skills?: string[];
    toObject?: () => Role;
}

export interface Experience {
    toObject?: () => Experience;
    experienceId: string;
    companyId?: mongoose.Types.ObjectId;
    companyName: string;
    companyLogo?: string;
    roles: Role[];
}

export interface JoinedCommunity {
    communityId: mongoose.Types.ObjectId;
    name: string;
}

export interface FollowingCompany {
    companyId: mongoose.Types.ObjectId;
    name: string;
}

export interface IPerson extends Document {
    name: string;
    username: string;
    bio?: string;
    profileSrc?: string;
    profileSrcSm?: string;
    bannerSrc?: string;
    userId: mongoose.Types.ObjectId;
    location: {
        city?: string;
        country?: string;
    };
    about?: string;
    totalFollowings?: number;
    totalFollowers?: number;
    github?: string;
    linkedin?: string;
    displayEmail?: string;
    skills?: Skill[];
    experiences?: Experience[];
    joinedCommunities?: JoinedCommunity[];
    followingCompanies?: FollowingCompany[];
    createdAt: Date;
    updatedAt: Date;
    languages: string[];
}

const personSchema = new Schema<IPerson>(
    {
        name: { type: String, required: true, trim: true },
        username: { type: String, trim: true, minLength: 8, maxLength: 100, unique: true, required: true },
        bio: { type: String, trim: true, maxLength: 300 },
        profileSrc: { type: String, trim: true },
        profileSrcSm: { type: String, trim: true },
        bannerSrc: { type: String, trim: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        location: { city: { type: String }, country: { type: String } },
        about: { type: String, trim: true, maxlength: 3000 },
        totalFollowings: { type: Number },
        totalFollowers: { type: Number },
        github: { type: String },
        linkedin: { type: String },
        displayEmail: { type: String, trim: true, lowercase: true },
        skills: [{
            _id: false,
            skillName: { type: String, trim: true, minlength: 2, maxlength: 150 },
            testScore: { type: Number, default: 0 },
            showScore: { type: Boolean, default: false },
            showExpRef: { type: Boolean, default: true },
        }],
        experiences: [{
            _id: false,
            experienceId: { type: String, trim: true, required: true },
            companyId: { type: Schema.Types.ObjectId, ref: 'Company' },
            companyName: { type: String, trim: true, required: true },
            companyLogo: { type: String },
            roles: [{
                _id: false,
                titleOfRole: { type: String, trim: true, minlength: 2, maxlength: 150, required: true },
                employmentType: {
                    type: String,
                    trim: true,
                    enum: ["Full-time", "Part-time", "Self-employed", "Freelance", "Contract", "Internship", "Apprenticeship", "Seasonal"],
                    required: true
                },
                location: { type: String, trim: true, required: true },
                locationType: { type: String, trim: true, enum: ["Onsite", "Hybrid", "Remote"], required: true },
                summary: { type: String, trim: true, maxlength: 1000 },
                fromDateMs: { type: Number, required: true },
                toDateMs: { type: Schema.Types.Mixed, default: 'Current' },
                skills: [String],
            }],
        }],
        languages: {
            type: [String],
            trim: true,
            default: ["English"]
        },
    },
    { timestamps: true }
);

personSchema.index({ name: 1 });
const Person = mongoose.model<IPerson>('Person', personSchema, 'persons');
export default Person;