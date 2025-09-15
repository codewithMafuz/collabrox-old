import mongoose, { Document, Schema } from 'mongoose';

export interface IFollow extends Document {
    follower: mongoose.Types.ObjectId;   // userId of the follower
    following: mongoose.Types.ObjectId;  // userId of the person being followed
    createdAt: Date;
}

const followSchema = new Schema<IFollow>(
    {
        // who is the follower (the user)
        follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        // whom they are following (another user/person)
        following: { type: Schema.Types.ObjectId, ref: 'Person', required: true },

        createdAt: { type: Date, default: Date.now }
    },
    { versionKey: false }
);

// Ensure a user cannot follow the same person twice
followSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = mongoose.model<IFollow>('Follow', followSchema, 'follows');
export default Follow;
