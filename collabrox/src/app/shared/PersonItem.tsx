import { MdOutlineLocationOn } from "react-icons/md";
import { textShorteningByWord } from '../../lib/StringUtils';
import FollowButtonPerson from './FollowButtonPerson';
import ImageBox from "../common/ImageBox";
import { useNavigateCustom } from "../../hooks/useNavigateCustom";
import { memo } from "react";
import { PersonItem as PersonItemType } from "../../apis/personApi";

interface PersonItemProps {
    initialObj: PersonItemType,
    followButton?: boolean;
    isFollowing?: boolean;
    txtLimit?: number;
}

const PersonItem = memo(({
    initialObj,
    followButton = true,
    isFollowing = false,
    txtLimit = 80,

}: PersonItemProps) => {
    const navigate = useNavigateCustom();

    const { _id, name, profileSrcSm, username, bio, location = {} } = initialObj
    const headlineTxt = textShorteningByWord(bio, txtLimit)

    return (
        <div className="resultBox w-full flex flex-col px-2 lg:px-1 py-1 gap-1 bg-white text-gray-900 text-[0.8rem] leading-5 ring-1 ring-gray-700/25">
            <div className="grid items-center justify-center grid-cols-[auto_1fr_100px]">
                <div className="flex flex-center p-2">
                    <ImageBox
                        imgSrc={profileSrcSm}
                        alt="profile img"
                        className='mr-2 lg:mr-3 rounded-full'
                        loading="lazy"
                    />
                </div>
                <div className="justify-self-start flex flex-col items-start justify-start gap-y-1.5">
                    <h3
                        onClick={() =>
                            navigate({ url: `/${username}` })
                        }
                        className="cursor-pointer hover:underline font-[600] text-[1rem]"
                    >
                        {name}
                    </h3>
                    {location.city || location.country ? (
                        <div className="text-gray-700 flex items-center font-[500]">
                            <MdOutlineLocationOn />
                            {location.city && <span>{location.city}</span>}
                            {location.country && <span>, {location.country}</span>}
                        </div>
                    ) : (
                        <span className="opacity-0">{'-'}</span>
                    )}
                </div>
                <div className="flex items-center justify-center">
                    {followButton && (
                        <FollowButtonPerson
                            initialFollowing={isFollowing}
                            className="px-3 rounded-lg outline outline-[1px] outline-gray-900 text-gray-800 font-[500] hover:brightness-90 mr-2"
                            personId={_id}
                        />
                    )}
                </div>
            </div>
            <div className="text-left text-gray-700 lg:text-[.9rem] lg:tracking-tight px-1 font-[500]">
                {headlineTxt ? headlineTxt : <span className="opacity-0">{'-'}</span>}
            </div>
        </div>
    );
})

export default PersonItem;