import sendTemplate from "../lib/templateHelpers.js";
import { Request, Response } from 'express';
import User, { SearchHistoryItem } from "../models/user.js";

class HistoryController {
    static getSearchHistory = async (req: Request, res: Response) => {
        try {
            const searchHistory = (await User.findById(req.user?._id, { searchHistory: true })) as SearchHistoryItem[]
            return res.send(sendTemplate(true, "Success", searchHistory))
        } catch (error) {
            console.log("error in getting search history", error)
            return res.send(sendTemplate(false))
        }
    }

    static addSearchHistory = async (req: Request<{}, {}, { searchHistoryNewObj: SearchHistoryItem }>, res: Response) => {
        try {
            const { searchHistoryNewObj } = req.body;
            const id = req.user?._id;

            if (!id || !searchHistoryNewObj?.uniqueId) {
                return res.send(sendTemplate(false));
            }

            await User.findByIdAndUpdate(id, {
                $push: {
                    searchHistory: {
                        $each: [searchHistoryNewObj],
                        $slice: -500, // Keeping only last 500 items
                        $position: 0 // Adding to start of array
                    }
                }
            });

            return res.send(sendTemplate(true));
        } catch (error) {
            console.log("error in addSearchHistory:", error);
            return res.send(sendTemplate(false));
        }
    };

    static removeSearchHistory = async (req: Request, res: Response) => {
        try {
            const loggedinId = req.user?._id;
            const uniqueId = req.params.uniqueId;

            if (!loggedinId || !uniqueId) {
                return res.send(sendTemplate(false, "Failed"));
            }
            await User.findByIdAndUpdate(
                loggedinId,
                { $pull: { searchHistory: { uniqueId } } }
            )

            return res.send(sendTemplate(true));
        } catch (error) {
            return res.send(sendTemplate(false));
        }
    };

    static clearSearchHistory = async (req: Request, res: Response) => {
        try {
            const id = req.user?._id
            await User.findByIdAndUpdate(id, {
                searchHistory: [],
            })
            return res.send(sendTemplate(true, "Success"))
        } catch (error) {
            return res.send(sendTemplate(false, "Failed"))
        }
    }

}

export default HistoryController