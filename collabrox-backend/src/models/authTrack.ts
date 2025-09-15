import mongoose, { Document, Schema } from 'mongoose';

export interface IAuthTrack extends Document {
    userId: mongoose.Types.ObjectId;
    createdAt?: number;
    updatedAt?: number;

    confMailSentAt?: number[];

    resetMailSentAt?: number[];
}

const authTrackSchema = new Schema<IAuthTrack>({
    userId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },

    // Confirmation ID for email verification
    confMailSentAt: {
        type: [Number],
        default: []
    },

    // Reset password related fields
    resetMailSentAt: {
        type: [Number],
        default: []
    },
}, {
    timestamps: true,
    versionKey: false
});

const AuthTrack = mongoose.model<IAuthTrack>('AuthTrack', authTrackSchema, 'authTracks');
export default AuthTrack;