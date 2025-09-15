import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { leftWidthPercentagesConfig } from './app/components/Sidebar';


type InitailSateType = {
    innerWidth: number;
    leftWidthPercentage: number;
    marginX: boolean;
    isDarkMode: boolean;
}

const initialState: InitailSateType = {
    innerWidth: window.innerWidth,
    leftWidthPercentage:
        leftWidthPercentagesConfig.find((obj) =>
            new RegExp(obj.regex).test(window.location.pathname)
        )?.percent || 70,
    marginX: true,
    isDarkMode: localStorage.getItem('theme') === 'dark' || window.matchMedia('(prefers-color-scheme: dark)').matches,
};

export const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setInnerWidth: (state) => {
            state.innerWidth = window.innerWidth
        },
        setLeftWidthPercentage: (state, { payload }: PayloadAction<number>) => {
            state.leftWidthPercentage = payload;
        },
        setMarginX: (state, { payload }: PayloadAction<boolean>) => {
            state.marginX = payload;
        },
        setIsDarkMode: (state, { payload }: PayloadAction<boolean>) => {
            state.isDarkMode = payload;
            // localStorage.setItem('theme', payload ? 'dark' : 'light');
        },
    },
});

export const {
    setInnerWidth,
    setLeftWidthPercentage,
    setMarginX,
    setIsDarkMode

} = appSlice.actions;

export default appSlice.reducer;
