import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';


export interface IUser extends Document {
    name: string;
    username: string;
    email: string;
    googleId?: string;
    githubId?: string;
    password?: string;
    role: UserRole;
    isEmailVerified: boolean;
    bio: string;
    profileSrcSm?: string;
    searchHistory?: SearchHistoryItem[];
    personId?: mongoose.Types.ObjectId;
    refreshTokens?: string[];
    closedNow: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type UserModel = mongoose.Model<IUser>;
export type UserRole = 'user' | 'admin' | 'recruiter';

export type SearchHistoryImagePath = {
    companyLogo?: string;
    profileSrcSm?: string;
}
export interface SearchHistoryItem {
    uniqueId: String;
    name: string;
    username?: string;
    companyId?: string;
    jobId?: string;
    communityId?: string;
}

const searchHistorySchema = new Schema<SearchHistoryItem>({
    uniqueId: { type: String },
    name: { type: String },
    username: { type: String },
    companyId: { type: String },
    jobId: { type: String },
    communityId: { type: String },
}, { _id: false })

const userSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        username: { type: String, trim: true, minLength: 2, maxLength: 100, unique: true, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true
        },
        githubId: {
            type: String,
            unique: true,
            sparse: true
        },
        password: {
            type: String,
            required: function () { return !this.googleId && !this.githubId; },
            minlength: 6,
            select: false,
        },
        role: {
            type: String,
            enum: ['user', 'admin', 'recruiter'],
            default: 'user',
        },
        isEmailVerified: { type: Boolean, default: false },
        bio: { type: String, trim: true, maxLength: 300, default: "" },
        profileSrcSm: { type: String, trim: true },

        searchHistory: [searchHistorySchema],
        personId: {
            type: Schema.Types.ObjectId,
            ref: 'Person',
        },
        refreshTokens: [{
            type: String,
            select: false
        }],
        closedNow: { type: Boolean, default: false },
    },
    { timestamps: true }
);


// Saving password as hashed format before saving the password
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    if (this.password) this.password = await bcrypt.hash(this.password, 10);
    next();
})

const User = mongoose.model<IUser, UserModel>('User', userSchema, 'users');
export default User;