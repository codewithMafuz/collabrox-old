import React, { useEffect, useState } from 'react';
import { useLazyCheckFollowingOfPersonQuery, useToggleFollowOfPersonMutation } from '../../apis/followApi';
import { useDispatch } from 'react-redux';
import { setTotalFollowRelatedCount } from '../pages/person/personSlice';
import Button from '../common/Button';

interface FollowButtonPersonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    initialFollowing?: boolean,
    personId: string
}

const FollowButtonPerson = ({
    initialFollowing,
    personId,
    ...props
}: FollowButtonPersonProps) => {
    const dispatch = useDispatch()
    const [isFollowing, setIsFollowing] = useState<boolean>(!!initialFollowing)

    useEffect(() => { setIsFollowing(!!initialFollowing) }, [initialFollowing])

    const [toggleFollowPerson, { data: response, isLoading }] = useToggleFollowOfPersonMutation();

    useEffect(() => {
        if (response?.status === 'OK') {
            const isFollowing = !!(response?.data?.isFollowing)
            setIsFollowing(isFollowing)
            dispatch(setTotalFollowRelatedCount({ targetPersonId: personId, isFollowing }))
        }
    }, [response]);

    return (
        typeof initialFollowing === 'boolean' ?
            <button
                disabled={isLoading}
                onClick={() => !isLoading && toggleFollowPerson({ targetPersonId: personId })}
                {...props}
            >
                {isFollowing ? 'Following' : 'Follow'}
            </button>
            : <div></div>
    );
}

export const FollowButtonPersonDynamic = ({
    personId,
    ...props
}: Omit<FollowButtonPersonProps, 'initialFollowing'>) => {
    const dispatch = useDispatch()
    const [checkFollowing] = useLazyCheckFollowingOfPersonQuery()
    const [isFollowing, setIsFollowing] = useState<boolean>(false)

    const [toggleFollowPerson, { data: response, isLoading }] = useToggleFollowOfPersonMutation();

    useEffect(() => {
        const check = async () => {
            try {
                const { data, status } = await checkFollowing({ targetPersonId: personId }).unwrap()
                if (status === 'OK') {
                    const following = data?.isFollowing
                    setIsFollowing(!!following)
                }
            } catch (er) {
                setIsFollowing(false)
            }
        }
        check()
    }, [personId])

    useEffect(() => {
        if (response?.status === 'OK') {
            const isFollowing = !!(response?.data?.isFollowing)
            setIsFollowing(isFollowing)
            dispatch(setTotalFollowRelatedCount({ targetPersonId: personId, isFollowing }))
        }
    }, [response]);

    return (
        <>
            <Button
                col='dark'
                sz='md'
                disabled={isLoading}
                onClick={() => !isLoading && toggleFollowPerson({ targetPersonId: personId })}
                {...props}
            >
                {isFollowing ? 'Following' : 'Follow'}
            </Button>
        </>
    );
}

export default FollowButtonPerson