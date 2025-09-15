import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { toast, ToastOptions } from 'react-toastify';

interface ToastState {
    lastRenderedContent: string;
    lastRenderedMs: number;
    toastContainerOptions: ToastOptions;
}

export interface SetToastContentTypes {
    content: string;
    toastOptions?: Partial<ToastOptions>;
}

const initialState: ToastState = {
    lastRenderedContent: '',
    lastRenderedMs: 0,
    toastContainerOptions: {
        type: 'error',
        className: 'mb-[1vh]',
        position: 'bottom-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        delay: 0,
        pauseOnFocusLoss: false,
    },
};

export const toastSlice = createSlice({
    name: 'toast',
    initialState,
    reducers: {
        setToast: (state, { payload }: PayloadAction<SetToastContentTypes>) => {
            let { content, toastOptions = {} } = payload;
            content = content.trim();

            if (content) {
                const isDifferentContent = state.lastRenderedContent !== content;
                const isTimeElapsed = Date.now() > state.lastRenderedMs + 5000;

                if (isDifferentContent || isTimeElapsed) {
                    state.lastRenderedContent = content;
                    state.lastRenderedMs = Date.now();

                    const finalToastOptions: ToastOptions = {
                        ...state.toastContainerOptions,
                        ...toastOptions,
                    };

                    toast(content, finalToastOptions);
                }
            }
        },
        setToastContainerOptions: (state, { payload }: PayloadAction<Partial<ToastOptions>>) => {
            state.toastContainerOptions = {
                ...state.toastContainerOptions,
                ...payload,
            };
        },
    },
});

export const { setToast, setToastContainerOptions } = toastSlice.actions;

export default toastSlice.reducer;