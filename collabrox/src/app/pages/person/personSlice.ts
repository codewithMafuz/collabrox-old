import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PersonItem } from '../../../apis/personApi';

interface InitialPersonStateType extends PersonItem {
    userId: string | undefined;
}

const initialPersonState: Partial<InitialPersonStateType> = {
    totalFollowers: 0,
    totalFollowings: 0,
    isSelfProfile: false,
    userId: undefined
};

export const personSlice = createSlice({
    name: 'person',
    initialState: initialPersonState,
    reducers: {
        resetPersonState: (): Partial<InitialPersonStateType> => initialPersonState,
        setUserId: (state, { payload }: PayloadAction<string | undefined>) => {
            state.userId = payload;
        },
        setUsername: (state, { payload }: PayloadAction<string>) => {
            state.username = payload || '';
        },
        setPersonData: (state, { payload }: PayloadAction<Partial<InitialPersonStateType>>) => {
            Object.assign(state, payload);
        },
        setTotalFollowRelatedCount: (
            state,
            { payload }: PayloadAction<{ targetPersonId: string; isFollowing: boolean }>
        ) => {
            const { targetPersonId, isFollowing } = payload;

            if (state.isSelfProfile) {
                state.totalFollowings = (state.totalFollowings ?? 0) + (isFollowing ? 1 : -1);
            } else if (targetPersonId === state.userId) {
                state.totalFollowers = (state.totalFollowers ?? 0) + (isFollowing ? 1 : -1);
            }
        },
    },
});

export const {
    resetPersonState,
    setUserId,
    setUsername,
    // setBannerImgObj,
    // setProfileImgObj,
    setPersonData,
    setTotalFollowRelatedCount,
} = personSlice.actions;

export default personSlice.reducer;