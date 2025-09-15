import { Request, Response } from 'express';
import User from "../models/user.js";
import Person from "../models/person.js";
import Follow from '../models/follow.js';
import sendTemplate from "../lib/templateHelpers.js";
import { isValidMongooseId } from "../lib/mongooseHelper.js";

interface GetListingParams {
    username: string;
}

interface GetListingQuery {
    cursor?: string;
    sortBy?: string;
    limit?: string;
}

interface GetSearchingQuery {
    keyword?: string;
    page?: string;
    limit?: string;
}

interface CheckFollowingParams {
    targetUserId: string;
}

interface ToggleFollowParams {
    userId: string;
}

type SortType = 'popular' | 'common' | 'recent';

class FollowController {
    /** ----------- FOLLOWINGS (list of people this user follows) ----------- */
    static getFollowings = async (req: Request<GetListingParams, {}, {}, GetListingQuery>, res: Response) => {
        if (!req.user?._id) return res.status(401).send(sendTemplate(false, 'Auth required'));

        const selfPerson = await Person.findOne({ userId: req.user._id }).select('_id');
        if (!selfPerson) return res.send(sendTemplate(false, "Self profile not found"));

        const { username } = req.params;
        if (!username || username.length < 3 || username.length > 120) {
            return res.status(401).send(sendTemplate(false, 'Profile not found'));
        }

        const person = await Person.findOne({ username }).select('_id');
        if (!person) return res.status(404).send(sendTemplate(false, "Profile not found"));

        const { cursor, sortBy = 'popular,recent' } = req.query;
        const limit = Math.min(Math.max(parseInt(req.query?.limit || '50', 10), 1), 100);
        const cursorDate = cursor ? new Date(cursor) : null;

        const sortKeys = sortBy.split(',').map(s => s.trim().toLowerCase() as SortType);
        const sortStage: Record<string, 1 | -1> = {};
        if (sortKeys.includes('popular')) sortStage['person.totalFollowers'] = -1;
        if (sortKeys.includes('common')) sortStage['isCommon'] = -1;
        if (sortKeys.includes('recent')) sortStage['followDoc.createdAt'] = -1;
        sortStage['person.name'] = 1; // always tie-break

        const pipeline: any[] = [
            { $match: { follower: person._id, ...(cursorDate && { createdAt: { $lt: cursorDate } }) } },
            { $addFields: { followDoc: "$$ROOT" } },
            {
                $lookup: {
                    from: 'person',
                    localField: 'following',
                    foreignField: '_id',
                    as: 'person'
                }
            },
            { $unwind: '$person' },
            {
                $lookup: {
                    from: 'follows',
                    let: { pid: '$person._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$follower', selfPerson._id] },
                                        { $eq: ['$following', '$$pid'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'meRelations'
                }
            },
            { $addFields: { isCommon: { $gt: [{ $size: '$meRelations' }, 0] } } },
            {
                $project: {
                    _id: '$person._id',
                    name: '$person.name',
                    username: '$person.username',
                    profileSrcSm: '$person.profileSrcSm',
                    bio: '$person.bio',
                    totalFollowers: '$person.totalFollowers',
                    isCommon: 1,
                    'followDoc.createdAt': 1
                }
            },
            { $sort: sortStage },
            { $limit: limit }
        ];

        const results = await Follow.aggregate(pipeline).exec();
        const last = results[results.length - 1];
        const nextCursor = last ? last.followDoc.createdAt.toISOString() : null;

        const final = results.map(r => ({
            _id: r._id,
            name: r.name,
            username: r.username,
            profileSrcSm: r.profileSrcSm,
            bio: r.bio,
            totalFollowers: r.totalFollowers,
            isFollowing: r.isCommon
        }));

        return res.status(200).send(sendTemplate(true, 'Successful', { results: final, nextCursor, hasMore: final.length === limit }));
    };

    /** ----------- FOLLOWERS (list of people following this user) ----------- */
    static getFollowers = async (req: Request<GetListingParams, {}, {}, GetListingQuery>, res: Response) => {
        if (!req.user?._id) return res.status(401).send(sendTemplate(false, 'Auth required'));

        const selfPerson = await Person.findOne({ userId: req.user._id }).select('_id');
        if (!selfPerson) return res.send(sendTemplate(false, "Self profile not found"));

        const { username } = req.params;
        if (!username || username.length < 3 || username.length > 120) {
            return res.status(401).send(sendTemplate(false, 'Profile not found'));
        }

        const person = await Person.findOne({ username }).select('_id');
        if (!person) return res.status(404).send(sendTemplate(false, "Profile not found"));

        const { cursor, sortBy = 'popular,recent' } = req.query;
        const limit = Math.min(Math.max(parseInt(req.query?.limit || '50', 10), 1), 100);
        const cursorDate = cursor ? new Date(cursor) : null;

        const sortKeys = sortBy.split(',').map(s => s.trim().toLowerCase() as SortType);
        const sortStage: Record<string, 1 | -1> = {};
        if (sortKeys.includes('popular')) sortStage['person.totalFollowers'] = -1;
        if (sortKeys.includes('common')) sortStage['isCommon'] = -1;
        if (sortKeys.includes('recent')) sortStage['followDoc.createdAt'] = -1;
        sortStage['person.name'] = 1;

        const pipeline: any[] = [
            { $match: { following: person._id, ...(cursorDate && { createdAt: { $lt: cursorDate } }) } },
            { $addFields: { followDoc: "$$ROOT" } },
            {
                $lookup: {
                    from: 'person',
                    localField: 'follower',
                    foreignField: '_id',
                    as: 'person'
                }
            },
            { $unwind: '$person' },
            {
                $lookup: {
                    from: 'follows',
                    let: { pid: '$person._id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$follower', selfPerson._id] },
                                        { $eq: ['$following', '$$pid'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'meRelations'
                }
            },
            { $addFields: { isCommon: { $gt: [{ $size: '$meRelations' }, 0] } } },
            {
                $project: {
                    _id: '$person._id',
                    name: '$person.name',
                    username: '$person.username',
                    profileSrcSm: '$person.profileSrcSm',
                    bio: '$person.bio',
                    totalFollowers: '$person.totalFollowers',
                    isCommon: 1,
                    'followDoc.createdAt': 1
                }
            },
            { $sort: sortStage },
            { $limit: limit }
        ];

        const results = await Follow.aggregate(pipeline).exec();
        const last = results[results.length - 1];
        const nextCursor = last ? last.followDoc.createdAt.toISOString() : null;

        const final = results.map(r => ({
            _id: r._id,
            name: r.name,
            username: r.username,
            profileSrcSm: r.profileSrcSm,
            bio: r.bio,
            totalFollowers: r.totalFollowers,
            isFollowing: r.isCommon
        }));

        return res.status(200).send(sendTemplate(true, 'Successful', { results: final, nextCursor, hasMore: final.length === limit }));
    };

    /** ----------- TOGGLE FOLLOW (follow/unfollow) ----------- */
    static toggleFollow = async (req: Request<ToggleFollowParams>, res: Response) => {
        try {
            if (!req.user?._id) return res.status(401).send(sendTemplate(false, "Authentication required"));

            const selfUserId = req.user._id;
            const targetUserId = req.params?.userId;
            if (!targetUserId || !isValidMongooseId(targetUserId)) {
                return res.status(400).send(sendTemplate(false, "Invalid target user ID"));
            }

            const selfUser = await User.findById(selfUserId).select('personId');
            const targetUser = await User.findById(targetUserId).select('personId');
            if (!selfUser?.personId) return res.status(404).send(sendTemplate(false, "Person not found"));
            if (!targetUser?.personId) return res.status(404).send(sendTemplate(false, "Target user not found"));

            const selfPersonId = selfUser.personId;
            const targetPersonId = targetUser.personId;
            if (selfPersonId.equals(targetPersonId)) {
                return res.status(400).send(sendTemplate(false, "You cannot follow yourself"));
            }

            const criteria = { follower: selfPersonId, following: targetPersonId };
            const deleted = await Follow.findOneAndDelete(criteria).lean();

            let isFollowing = false;
            let countChange = -1;

            if (!deleted) {
                await Follow.create([criteria]);
                isFollowing = true;
                countChange = 1;
            }

            await Promise.all([
                Person.findByIdAndUpdate(selfPersonId, { $inc: { totalFollowings: countChange } }),
                Person.findByIdAndUpdate(targetPersonId, { $inc: { totalFollowers: countChange } })
            ]);

            return res.status(200).send(sendTemplate(true, `Successfully ${isFollowing ? 'followed' : 'unfollowed'} user.`, { isFollowing }));
        } catch (error) {
            console.error("Error in toggleFollow:", error);
            return res.status(500).send(sendTemplate(false, 'Failed to toggle follow status'));
        }
    };

    /** ----------- CHECK FOLLOWING ----------- */
    static checkFollowing = async (req: Request<CheckFollowingParams>, res: Response) => {
        try {
            if (!req.user?._id) {
                return res.status(200).send(sendTemplate(true, "Successful", { isFollowing: false }));
            }

            const loggedInUserId = req.user._id;
            const targetUserId = req.params?.targetUserId;
            if (!targetUserId || !isValidMongooseId(targetUserId)) {
                return res.status(400).send(sendTemplate(false, "Invalid target user ID"));
            }

            const selfUser = await User.findById(loggedInUserId).select('personId');
            const targetUser = await User.findById(targetUserId).select('personId');
            if (!selfUser?.personId) return res.status(404).send(sendTemplate(false, "Person not found"));
            if (!targetUser?.personId) return res.status(404).send(sendTemplate(false, "Target user not found"));

            const followExists = await Follow.exists({ follower: selfUser.personId, following: targetUser.personId });

            return res.status(200).send(sendTemplate(true, "Successful", { isFollowing: !!followExists }));
        } catch (error) {
            console.error("Error in checkFollowing:", error);
            return res.status(500).send(sendTemplate(false, 'Failed to check follow status'));
        }
    };

    /** ----------- GET FOLLOWINGS (people the user follows) ----------- */
    static getFollowingsQuery = async (req: Request<GetListingParams, {}, {}, GetListingQuery>, res: Response) => {
        try {
            if (!req.user?._id) return res.status(401).send(sendTemplate(false, 'Auth required'));

            const selfPerson = await Person.findOne({ userId: req.user._id }).select('_id');
            if (!selfPerson) return res.send(sendTemplate(false, "Self profile not found"));

            const { username } = req.params;
            if (!username || username.length < 3 || username.length > 120) {
                return res.status(401).send(sendTemplate(false, 'Profile not found'));
            }

            const person = await Person.findOne({ username }).select('_id');
            if (!person) return res.status(404).send(sendTemplate(false, "Profile not found"));

            const { cursor, sortBy = 'popular,recent' } = req.query;
            const limit = Math.min(Math.max(parseInt(req.query?.limit || '50', 10), 1), 100);
            const cursorDate = cursor ? new Date(cursor) : null;

            const sortStage: Record<string, 1 | -1> = {};
            const sortKeys = sortBy.split(',').map(s => s.trim().toLowerCase());
            if (sortKeys.includes('popular')) sortStage['person.totalFollowers'] = -1;
            if (sortKeys.includes('common')) sortStage['isCommon'] = -1;
            if (sortKeys.includes('recent')) sortStage['followDoc.createdAt'] = -1;
            sortStage['person.name'] = 1;

            const pipeline: any[] = [
                { $match: { follower: person._id, type: 'person', ...(cursorDate && { createdAt: { $lt: cursorDate } }) } },
                { $addFields: { followDoc: "$$ROOT" } },
                { $lookup: { from: 'person', localField: 'following', foreignField: '_id', as: 'person' } },
                { $unwind: '$person' },
                {
                    $lookup: {
                        from: 'follows',
                        let: { pid: '$person._id' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$follower', selfPerson._id] },
                                        { $eq: ['$following', '$$pid'] }
                                    ]
                                }
                            }
                        }],
                        as: 'meRelations'
                    }
                },
                { $addFields: { isCommon: { $gt: [{ $size: '$meRelations' }, 0] } } },
                {
                    $project: {
                        _id: '$person._id',
                        name: '$person.name',
                        username: '$person.username',
                        profileSrcSm: '$person.profileSrcSm',
                        bio: '$person.bio',
                        totalFollowers: '$person.totalFollowers',
                        isCommon: 1,
                        'followDoc.createdAt': 1
                    }
                },
                { $sort: sortStage },
                { $limit: limit }
            ];

            const results = await Follow.aggregate(pipeline).exec();
            const nextCursor = results.length ? results[results.length - 1].followDoc.createdAt.toISOString() : null;

            const final = results.map(r => ({
                _id: r._id,
                name: r.name,
                username: r.username,
                profileSrcSm: r.profileSrcSm,
                bio: r.bio,
                totalFollowers: r.totalFollowers,
                isFollowing: r.isCommon
            }));

            return res.status(200).send(sendTemplate(true, 'Successful', { results: final, nextCursor, hasMore: final.length === limit }));
        } catch (error) {
            console.error("Error in getFollowings:", error);
            return res.status(500).send(sendTemplate(false, 'Server error'));
        }
    };

    /** ----------- GET FOLLOWERS (people following the user) ----------- */
    static getFollowersQuery = async (req: Request<GetListingParams, {}, {}, GetListingQuery>, res: Response) => {
        try {
            if (!req.user?._id) return res.status(401).send(sendTemplate(false, 'Auth required'));

            const selfPerson = await Person.findOne({ userId: req.user._id }).select('_id');
            if (!selfPerson) return res.send(sendTemplate(false, "Self profile not found"));

            const { username } = req.params;
            if (!username || username.length < 3 || username.length > 120) {
                return res.status(401).send(sendTemplate(false, 'Profile not found'));
            }

            const person = await Person.findOne({ username }).select('_id');
            if (!person) return res.status(404).send(sendTemplate(false, "Profile not found"));

            const { cursor, sortBy = 'popular,recent' } = req.query;
            const limit = Math.min(Math.max(parseInt(req.query?.limit || '50', 10), 1), 100);
            const cursorDate = cursor ? new Date(cursor) : null;

            const sortStage: Record<string, 1 | -1> = {};
            const sortKeys = sortBy.split(',').map(s => s.trim().toLowerCase());
            if (sortKeys.includes('popular')) sortStage['person.totalFollowers'] = -1;
            if (sortKeys.includes('common')) sortStage['isCommon'] = -1;
            if (sortKeys.includes('recent')) sortStage['followDoc.createdAt'] = -1;
            sortStage['person.name'] = 1;

            const pipeline: any[] = [
                { $match: { following: person._id, type: 'person', ...(cursorDate && { createdAt: { $lt: cursorDate } }) } },
                { $addFields: { followDoc: "$$ROOT" } },
                { $lookup: { from: 'person', localField: 'follower', foreignField: '_id', as: 'person' } },
                { $unwind: '$person' },
                {
                    $lookup: {
                        from: 'follows',
                        let: { pid: '$person._id' },
                        pipeline: [{
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$follower', selfPerson._id] },
                                        { $eq: ['$following', '$$pid'] }
                                    ]
                                }
                            }
                        }],
                        as: 'meRelations'
                    }
                },
                { $addFields: { isCommon: { $gt: [{ $size: '$meRelations' }, 0] } } },
                {
                    $project: {
                        _id: '$person._id',
                        name: '$person.name',
                        username: '$person.username',
                        profileSrcSm: '$person.profileSrcSm',
                        bio: '$person.bio',
                        totalFollowers: '$person.totalFollowers',
                        isCommon: 1,
                        'followDoc.createdAt': 1
                    }
                },
                { $sort: sortStage },
                { $limit: limit }
            ];

            const results = await Follow.aggregate(pipeline).exec();
            const nextCursor = results.length ? results[results.length - 1].followDoc.createdAt.toISOString() : null;

            const final = results.map(r => ({
                _id: r._id,
                name: r.name,
                username: r.username,
                profileSrcSm: r.profileSrcSm,
                bio: r.bio,
                totalFollowers: r.totalFollowers,
                isFollowing: r.isCommon
            }));

            return res.status(200).send(sendTemplate(true, 'Successful', { results: final, nextCursor, hasMore: final.length === limit }));
        } catch (error) {
            console.error("Error in getFollowers:", error);
            return res.status(500).send(sendTemplate(false, 'Server error'));
        }
    };

}

export default FollowController;
