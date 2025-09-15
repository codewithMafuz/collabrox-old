import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../apis/userApi';

type UserState = Partial<User>

export const initialUserState: UserState = {}

export const userSlice = createSlice({
    name: 'user',
    initialState: initialUserState,
    reducers: {
        resetState: () => {
            return initialUserState;
        },
        setId: (state, { payload }: PayloadAction<string | undefined>) => {
            state._id = payload;
        },
        setUsername: (state, { payload }: PayloadAction<string | undefined>) => {
            state.username = payload;
        },
        setProfileSrcSm: (state, { payload }: PayloadAction<string | undefined>) => {
            state.profileSrcSm = payload;
        },
        setUserData: (state, { payload }: PayloadAction<UserState>) => {
            Object.assign(state, payload)
        },
    },
});

export const { resetState, setId, setUsername, setProfileSrcSm, setUserData } = userSlice.actions;

export default userSlice.reducer;