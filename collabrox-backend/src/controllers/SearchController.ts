import Person from '../models/person.js';
import Follow from '../models/follow.js';
import sendTemplate from "../lib/templateHelpers.js";
import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { sanitizedQuery } from 'lib/stringHelpers.js';

type GetSearchResultsQueries = { query: string; page?: string; limit?: string; };

class SearchController {
    // Keyword suggestions for people only
    static getKeywordSuggestions = async (req: Request<{ keyword: string }>, res: Response) => {
        try {
            const keyword = req.params?.keyword?.toLowerCase() || '';
            const userId = req.user?._id;

            // Fetch user search history
            let searchHistory: any[] = [];
            if (userId) {
                const user = await (await import('../models/user.js')).default
                    .findById(userId)
                    .select('searchHistory')
                    .lean();

                if (user?.searchHistory?.length) {
                    searchHistory = user.searchHistory.map((item: any) => ({
                        ...item,
                        isSearchHistory: true
                    }));
                }
            }

            if (keyword.trim() === '') {
                return res.status(200).send(sendTemplate(true, 'Success', searchHistory));
            }

            const pipeline = [
                {
                    $match: { name: { $regex: keyword, $options: 'i' } }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        type: { $literal: 'person' },
                        score: {
                            $add: [
                                { $strLenCP: "$name" },
                                { $indexOfCP: [{ $toLower: "$name" }, keyword] }
                            ]
                        }
                    }
                },
                { $sort: { score: 1 } },
                { $limit: 7 }
            ];

            const persons = await Person.aggregate(pipeline as any);

            const suggestions = [
                ...searchHistory,
                ...persons
                    .sort((a, b) => a.score - b.score)
                    .slice(0, 10)
                    .map(({ _id, name, type }) => ({
                        id: _id,
                        name,
                        type,
                        isSearchHistory: false
                    }))
            ];

            res.status(200).send(sendTemplate(true, 'Success', suggestions));
        } catch (error) {
            console.error('Error in getKeywordSuggestions:', error);
            return res.status(500).send(sendTemplate(false));
        }
    };

    // Person search only
    static getPersons = async (req: Request<{}, {}, {}, GetSearchResultsQueries>, res: Response) => {
        try {
            const { query = '', page = '1', limit = '10' } = req.query;
            const selfUserId = req.user?._id;
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.max(1, parseInt(limit));
            const skip = (pageNum - 1) * limitNum;

            const finalQuery = sanitizedQuery(query);
            if (!finalQuery) {
                return res.status(200).send(sendTemplate(true, 'No query provided', []));
            }
            if (finalQuery.length > 100) {
                return res.status(200).send(sendTemplate(true, 'Too long query provided', []));
            }

            const searchRegex = new RegExp(finalQuery, 'i');

            const $or = [
                { name: searchRegex },
                ...(finalQuery.startsWith('@') && finalQuery.length >= 8 ? [{ username: searchRegex }] : []),
                ...(finalQuery.length >= 3 ? [
                    { 'location.city': searchRegex },
                    { 'location.country': searchRegex }
                ] : []),
                ...(finalQuery.length >= 4 ? [
                    { bio: searchRegex },
                    { skills: { $elemMatch: { skillName: searchRegex } } }
                ] : []),
                ...(/^(https?:\/\/)?(www\.)?(github\.com|linkedin\.com)(\/|\/in\/)([a-zA-Z0-9_-]+)\/?$/i.test(finalQuery)
                    ? [{ github: searchRegex }, { linkedin: searchRegex }]
                    : [])
            ];

            const filter = $or.length > 0 ? { $or } : {};

            const persons = await Person.find(filter)
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean();

            const personIds = persons.map(p => p._id);

            // Add follow info
            let followingsMap: Record<string, boolean> = {};
            if (selfUserId && personIds.length > 0) {
                const followings = await Follow.find({
                    follower: selfUserId,
                    following: { $in: personIds }
                }).select('following').lean();

                followingsMap = followings.reduce((acc, doc) => {
                    acc[doc.following.toString()] = true;
                    return acc;
                }, {} as Record<string, boolean>);
            }

            const enrichedPersons = persons.map(personItem => ({
                ...personItem,
                isFollowing: !!followingsMap[personItem._id.toString()]
            }));

            res.status(200).send(sendTemplate(true, 'Successful', enrichedPersons));
        } catch (error) {
            console.error('Error in getPersons:', error);
            return res.status(500).send(sendTemplate(false));
        }
    };
}

export default SearchController;
