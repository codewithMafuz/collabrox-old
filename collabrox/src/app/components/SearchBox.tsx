import { useState, useEffect, useRef } from 'react';
import { MdOutlineSearch, MdHistory, MdClose } from "react-icons/md";
import { useLazyGetKeywordSuggestionsQuery } from '../../apis/searchApi';
import { useNavigateCustom } from '../../hooks/useNavigateCustom';
import QuickBox from '../shared/QuickBox';
import Typography from '../common/Typography';
import { useLazySearchHistoryQuery, useRemoveSearchHistoryMutation } from '../../apis/historyApi';
import { classNames, getLongestCommonPrefixLengthCharCode } from '../../lib/StringUtils';
import ImageBox from '../common/ImageBox';
import useDebounce from '../../hooks/useDebounce';

type SuggestionItem = {
    _id?: string;
    name: string;
    isSearchHistory?: boolean;
    username?: string; // for person
    profileSrc?: string;
};

interface SearchBoxPropsTypes {
    defaultValue?: string;
    setIsFocusedSearchBox: (focus: boolean) => void;
}

const SearchBox = ({ defaultValue, setIsFocusedSearchBox }: SearchBoxPropsTypes) => {
    const navigate = useNavigateCustom();

    const [keyword, setKeyword] = useState<string>(defaultValue || "");
    const [fetchKeywordSuggestion, { data: suggestionResponse }] = useLazyGetKeywordSuggestionsQuery();
    const [removeSearchHistory] = useRemoveSearchHistoryMutation();
    const [fetchSearchHistory, { data: searchHistoryResponse }] = useLazySearchHistoryQuery();
    const [allowFetching, setAllowFetching] = useState<boolean>(false);
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
    const [isFocused, setIsFocused] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionBox = useRef<HTMLDivElement>(null);
    const [showSearchHistoryBox, setShowSearchHistoryBox] = useState<boolean>(false);
    const [searchHistoryData, setSearchHistoryData] = useState<any[]>([]);

    useEffect(() => {
        if (typeof defaultValue === 'string') {
            setAllowFetching(false);
            setKeyword(defaultValue);
            setAllowFetching(false);
        }
    }, [defaultValue]);

    useEffect(() => {
        if (searchHistoryResponse?.status === "OK") {
            setSearchHistoryData(searchHistoryResponse.data!);
        }
    }, [searchHistoryResponse]);

    const debouncedFetchKeywordSuggestion = useDebounce((kw: string) => {
        fetchKeywordSuggestion(kw);
    }, 100);

    useEffect(() => {
        if (allowFetching && keyword.trim()) {
            debouncedFetchKeywordSuggestion(keyword);
        }
    }, [keyword, allowFetching]);

    useEffect(() => {
        if (suggestionResponse?.data) {
            const processedSuggestions = [...suggestionResponse.data];
            if (keyword) {
                processedSuggestions.unshift({
                    name: keyword,
                    uniqueId: '_first_one_in_suggestion_list',
                });
            }
            const firstItem = processedSuggestions[0];
            if (firstItem?.isSearchHistory) {
                const fullStr = firstItem.name;
                const start = getLongestCommonPrefixLengthCharCode(fullStr, keyword.trim());
                inputRef.current?.setSelectionRange(start, fullStr.length);
                processedSuggestions.unshift({ ...firstItem });
            }
            setSuggestions(processedSuggestions);
        }
    }, [suggestionResponse?.data, keyword]);

    const showNthSuggestion = (index: number) => {
        setActiveIndex(index);
        setAllowFetching(false);
        setKeyword(suggestions[index].name);
        inputRef.current?.focus();
    };

    const doSearch = (query: string) => {
        const queryPath = `/search?query=${encodeURIComponent(query)}&category=person&page=1`;
        navigate({ url: queryPath, replace: false, checkSearchToo: true });
        setIsFocused(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            if (activeIndex >= 0 && suggestions[activeIndex]) {
                doSearch(suggestions[activeIndex].name);
            } else if (keyword.length > 0 && keyword.length <= 220) {
                doSearch(keyword);
            }
            return;
        }
        if (!suggestions.length) return;
        switch (ev.key) {
            case 'ArrowDown':
                ev.preventDefault();
                setActiveIndex((prev) => (prev + 1) % suggestions.length);
                break;
            case 'ArrowUp':
                ev.preventDefault();
                setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
                break;
        }
    };

    const handleRemoveFromHistory = async (id?: string) => {
        try {
            if (id) {
                await removeSearchHistory({ uniqueId: id });
                setSuggestions(prev => prev.filter(item => item._id !== id));
                setSearchHistoryData((prev) => prev.filter((o) => o._id !== id));
            }
        } catch (error) {
            console.error('Error removing search history:', error);
        }
    };

    const handleInputBlur = (e: React.FocusEvent) => {
        if (
            suggestionBox.current &&
            !suggestionBox.current.contains(e.relatedTarget as Node) &&
            !showSearchHistoryBox
        ) {
            setIsFocusedSearchBox(false);
            setIsFocused(false);
        }
    };

    return (
        <>
            {/* Search history box */}
            {showSearchHistoryBox && (
                <QuickBox
                    show={true}
                    closeOnBlur={true}
                    topBarTitle='All search history'
                    onClose={() => {
                        setShowSearchHistoryBox(false);
                        inputRef.current?.focus();
                    }}
                >
                    <div className="px-2 md:px-10 lg:px-14 xl:px-20 py-2 space-y-2 lg:space-y-1">
                        {searchHistoryData.length > 0 ? (
                            searchHistoryData.map((historyItem) => (
                                <div
                                    key={historyItem._id}
                                    className='flex items-center justify-between rounded-full ring-[1px] ring-stone-300 py-1 px-2 md:px-5'
                                >
                                    <Typography variant='p'>{historyItem.name}</Typography>
                                    <MdClose
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveFromHistory(historyItem._id);
                                        }}
                                        title='Remove from history'
                                        className='cursor-pointer hover:bg-gray-50 text-[1.25rem]'
                                    />
                                </div>
                            ))
                        ) : (
                            <Typography variant='p'>No search history</Typography>
                        )}
                    </div>
                </QuickBox>
            )}

            {/* Search and suggestions */}
            <div className='relative w-full md:w-[180px] lg:w-[220px]'>
                <label
                    htmlFor='search'
                    className="relative w-full h-full block rounded-full bg-white text-[.95rem]"
                >
                    <MdOutlineSearch
                        className='absolute left-3 top-1/2 -translate-y-1/2 text-[1.2rem] text-gray-900'
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => inputRef.current?.focus()}
                    />
                    <input
                        id='search'
                        ref={inputRef}
                        name='search'
                        type="search"
                        placeholder='Search people'
                        value={keyword}
                        autoComplete="off"
                        onChange={(ev) => {
                            const val = ev.target.value.replace(/  +/g, ' ');
                            if (val.length > 200) return;
                            setAllowFetching(true);
                            setKeyword(val);
                            setActiveIndex(0);
                        }}
                        className='w-full pl-10 pr-3 py-1 px-1 rounded-full border-0 outline-0 focus:border-0 focus:outline-0'
                        onFocus={() => {
                            setIsFocusedSearchBox(true);
                            setIsFocused(true);
                            setAllowFetching(true);
                            setActiveIndex(0);
                        }}
                        onBlur={handleInputBlur}
                        onKeyDown={handleKeyDown}
                    />
                </label>

                {isFocused && suggestions.length > 0 && !showSearchHistoryBox && (
                    <>
                        <div
                            className="fixed inset-0 bg-gray-500/50 h-screen z-[-1]"
                            onClick={() => {
                                setIsFocused(false);
                                setIsFocusedSearchBox(false);
                                inputRef.current?.blur();
                            }}
                        />
                        <div
                            ref={suggestionBox}
                            className='suggestionsBox absolute flex flex-col items-center justify-center w-[360px] left-[-45%] translate-y-1 h-auto bg-white rounded-[4px] z-50 border border-gray-300'
                        >
                            {suggestions.map((suggestion, suggestionOptionIndex) => (
                                <div
                                    key={suggestionOptionIndex}
                                    className={classNames(
                                        activeIndex === suggestionOptionIndex ? 'bg-gray-200' : '',
                                        'h-[34px] w-full text-[1rem] flex items-center justify-center hover:bg-gray-100 focus:bg-gray-100 px-1 cursor-pointer'
                                    )}
                                >
                                    <div className='relative z-[100] w-[8%] flex items-center justify-center'>
                                        {suggestion.isSearchHistory ? (
                                            <MdHistory
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    showNthSuggestion(suggestionOptionIndex);
                                                    setIsFocused(true);
                                                }}
                                                title='Search history'
                                                className='cursor-pointer hover:bg-gray-50 text-[1.3rem] w-[50%]'
                                            />
                                        ) : (
                                            <MdOutlineSearch
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={() => {
                                                    setKeyword(suggestion.name);
                                                    setIsFocused(true);
                                                }}
                                                title=''
                                                className='cursor-pointer hover:bg-gray-50 text-[1.25rem] w-[50%]'
                                            />
                                        )}
                                    </div>
                                    <ImageBox
                                        imgSrc={suggestion.profileSrc}
                                        width='26px'
                                        height='26px'
                                        className='mx-1'
                                    />
                                    <div
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => doSearch(suggestion.name)}
                                        className='suggestionOption text-lg w-[85%] flex items-center justify-start pl-1 relative z-[10]'
                                    >
                                        <span className='text-[1rem] font-[500]'>
                                            {suggestion.name.length > 40
                                                ? `${suggestion.name.slice(0, 36)}...`
                                                : suggestion.name}
                                        </span>
                                    </div>
                                    <div className="w-[7%]">
                                        {suggestion.isSearchHistory && (
                                            <MdClose
                                                onMouseDown={(e) => e.preventDefault()}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveFromHistory(suggestion._id);
                                                }}
                                                title='Remove from history'
                                                className='cursor-pointer hover:bg-gray-50 text-[1.25rem]'
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div className='h-auto w-full text-[1rem] flex items-center justify-center font-[600] text-center py-2'>
                                <button
                                    className='px-2 py-1 hover:underline'
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowSearchHistoryBox(true);
                                        fetchSearchHistory();
                                    }}
                                >
                                    Show all search history
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default SearchBox;
