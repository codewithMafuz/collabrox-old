import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import InfiniteScroll from "react-infinite-scroll-component";
import { MdClose } from "react-icons/md";
import QuickBox from "../shared/QuickBox";
import Typography from "../common/Typography";
import FollowItem from "./FollowItem";
import { useGetFollowersOfPersonQuery } from "../../apis/followApi";
import { RootState } from "../../store/store";
import { useSearchParams, useNavigate } from "react-router-dom";
import FilteringButtons from "../shared/FilteringButtons";
import Spinner from "../common/Spinner";

const LIMIT = 20000;
type SortType = "popular" | "recent" | "common";

const Followers: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const isAuthenticated = useSelector((state: RootState) => state.root.isAuthenticated)
    const { isSelfProfile, name, _id = '', username } = useSelector((state: RootState) => state.person);

    const [currentData, setCurrentData] = useState<{ data: any[]; hasMore: boolean }>({
        data: [],
        hasMore: false,
    });

    const [cursor, setCursor] = useState<string>();

    const [allowedSortTypes, setAllowedSortTypes] = useState<SortType[]>(['popular'])

    const urlSortBy = searchParams.get("sortBy");
    const [sortBy, setSortBy] = useState<SortType[]>(
        urlSortBy && urlSortBy.length >= 6
            ? (urlSortBy.toLowerCase().split(",").map((i) => i.trim())) as SortType[]
            : ["popular", "recent"]
    );

    const { data: response, isLoading } = useGetFollowersOfPersonQuery({
        username: username!,
        sortBy: sortBy.join(','),
        cursor: cursor,
        limit: "50"
    });

    const loadMore = () => {
        if (response?.data?.results.length) {
            const lastItem = response.data.results[response.data.results.length - 1];
            setCursor(lastItem._id);
        }
    };

    // Setting allowed sort type when person changes for user privacy, though also have this system in backend
    useEffect(() => {
        setAllowedSortTypes((prev) => {
            const current = prev
            if (isSelfProfile) current.push('recent')
            if (!isSelfProfile) current.push('common')
            return current
        })
    }, [isSelfProfile])


    // Reset data and fetch on sortBy change
    useEffect(() => {
        console.log(sortBy)
        setCurrentData({ data: [], hasMore: false });
        setSearchParams({ open: "followers", sortBy: sortBy.length > 0 ? sortBy.join(',') : 'popular' }, { replace: true });
    }, [sortBy]);

    // Running loadMore also after clearing the data if sortBy changes
    useEffect(() => {
        if (currentData.data.length === 0) {
            loadMore()
        }
    }, [currentData.data.length, _id])

    // Update data on fetch response
    useEffect(() => {
        if (response?.status === "OK") {
            setCurrentData((prev) => ({
                data: [...prev.data, ...response.data!.results],
                hasMore: response.data!.hasMore,
            }));
        }
    }, [response]);

    const handleClickSortChange = (newType: SortType) => {
        setSortBy(sortBy.includes(newType) ? sortBy.filter((type) => type !== newType) : [...sortBy, newType]);
    };

    const handleClose = () => {
        searchParams.delete("open");
        searchParams.delete("sortBy");
        setSearchParams(searchParams, { replace: true });
        navigate(-1); // Go back to the previous route if applicable
    };

    return (
        <QuickBox allowScroll={false} showTopBar={false}>
            {isAuthenticated ?
                <div
                    id="scrollable-container-personsection"
                    className="h-full w-full overflow-y-auto custom-scrollbar-css-sm"
                >
                    {/* Top Sticky Header */}
                    <div className="sticky bg-white top-0 left-0 w-full flex justify-between items-center px-4 py-2 shadow-sm border-b border-gray-300">
                        <Typography variant="subtitle" className="font-[600]">
                            {isSelfProfile ? "Your" : `${name?.split(" ")[0]}'s`} followers
                        </Typography>
                        { }
                        <div className="flex gap-2 sm:gap-6">
                            {/* Filter Button with Sort Dropdown */}
                            <FilteringButtons
                                buttonNames={allowedSortTypes}
                                onClick={(btnName) => {
                                    handleClickSortChange(btnName as SortType)
                                }}
                            />

                            {/* Close Button */}
                            <button onClick={handleClose} className="text-[1.3rem] text-gray-900 hover:bg-gray-200">
                                <MdClose />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <InfiniteScroll
                        className="px-1 sm:px-3 md:px-8 lg:px-20 xl:px-28"
                        scrollableTarget="scrollable-container-personsection"
                        dataLength={currentData.data.length}
                        next={loadMore}
                        hasMore={currentData.data.length < LIMIT && currentData.hasMore}
                        loader={<div className="flex flex-center w-full"><Spinner fontSize="1.1rem" /></div>}
                        endMessage={
                            <p className="text-[1.2rem] font-[600] text-center py-4">
                                {currentData.data.length >= LIMIT ?
                                    "List limit reached" :
                                    !isLoading && currentData.data.length === 0 ?
                                        "No followers" :
                                        isLoading ?
                                            '' : "Reached end"}
                            </p>
                        }
                    >
                        {currentData.data.map((obj, i) => <FollowItem key={i} {...obj as any} />)}
                    </InfiniteScroll>
                </div>
                :
                <div className="flex items-center justify-center mt-4">
                    <Typography variant="subtitle">You must login to see followers</Typography>
                </div>
            }
        </QuickBox>
    );
};

export default Followers;

