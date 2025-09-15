import ImageBox from '../common/ImageBox'
import FollowButtonPerson from '../shared/FollowButtonPerson'
import { Link } from 'react-router-dom'
import Typography from '../common/Typography'
import { textShorteningByWord } from '../../lib/StringUtils'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'

export interface FollowItemProps {
    _id: string,
    name: string,
    username: string,
    profileSrc?: string | null,
    isFollowing?: boolean,
    bio?: string,
}

function FollowItem({ _id,
    name,
    username,
    profileSrc,
    isFollowing,
    bio = '',
}: FollowItemProps) {
    const isSelfProfile = useSelector((state: RootState) => state.user._id) === _id

    return (
        <div
            className="w-full h-[80px] sm:h-[90px] md:h-[70px] lg:h-[60px] flex flex-row items-center justify-between my-1 bg-white shadow-sm border-gray-200 rounded-md px-1 lg:px-2"
        >
            <div className='flex items-center gap-1.5 lg:gap-[10px]'>
                <ImageBox
                    onClick={() => { }}
                    imgSrc={profileSrc || undefined}
                    width='30px'
                    height='30px'
                />
                <div className="flex flex-col">
                    <Typography variant='p'>
                        <Link className='cursor-pointer hover:underline' title='See person' to={`/${username}`}>
                            {name}
                        </Link>
                    </Typography>
                    <Typography variant='small' className='leading-[15px] px-1'>{textShorteningByWord(bio, 70)}</Typography>
                </div>
            </div>
            <FollowButtonPerson
                initialFollowing={isSelfProfile ? undefined : isFollowing}
                className='px-2 lg:px-3 rounded-lg outline outline-[1px] outline-gray-900 text-gray-800 font-[500] hover:brightness-90'
                personId={_id.toString()}
            />
        </div>
    )
}

export default FollowItem
