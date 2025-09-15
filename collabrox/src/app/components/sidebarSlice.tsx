import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ComponentId } from './Sidebar';
import { ALL_ROUTES_REGEX } from '../../routes';

interface RegisteredComponent {
    id: ComponentId;
    pathPattern: string; // store regex source string
    show: boolean;
    positionIndex: number;
    props?: Record<string, unknown>;
}

interface SidebarState {
    className: string | null;
    registeredComponentsConfig: RegisteredComponent[];
}

const initialState: SidebarState = {
    className: '',
    registeredComponentsConfig: [
        {
            id: 'LanguageSectionSidebar',
            pathPattern: ALL_ROUTES_REGEX['/:username'].source,
            show: true,
            positionIndex: 0,
        },
        {
            id: 'SimilarPersonItems',
            pathPattern: ALL_ROUTES_REGEX['/:username'].source,
            show: true,
            positionIndex: 0,
        },
    ],
};

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setClassName: (state, { payload }: PayloadAction<string | null>) => {
            state.className = payload;
        },
        updatePositionIndex: (state, { payload }: PayloadAction<{ id: ComponentId; index: number }>) => {
            const { id, index: targetIndex } = payload;
            const otherComponents = state.registeredComponentsConfig.filter(c => c.id !== id);
            const targetComponent = state.registeredComponentsConfig.find(c => c.id === id);

            if (!targetComponent) return;

            const updatedComponents = [
                ...otherComponents.slice(0, targetIndex),
                targetComponent,
                ...otherComponents.slice(targetIndex)
            ];

            state.registeredComponentsConfig = updatedComponents.map((component, index) => ({
                ...component,
                positionIndex: index
            }));
        },
        reorderComponents: (state, { payload }: PayloadAction<ComponentId[]>) => {
            const sortedIds = payload;
            const idSet = new Set(sortedIds);

            const specified = state.registeredComponentsConfig.filter(c => idSet.has(c.id));
            const unspecified = state.registeredComponentsConfig.filter(c => !idSet.has(c.id));

            specified.sort((a, b) => sortedIds.indexOf(a.id) - sortedIds.indexOf(b.id));
            unspecified.sort((a, b) => a.positionIndex - b.positionIndex);

            state.registeredComponentsConfig = [
                ...specified,
                ...unspecified
            ].map((c, i) => ({ ...c, positionIndex: i }));
        },
        toggleComponentsComponentShow: (state, { payload }: PayloadAction<{ id: ComponentId; show: boolean }>) => {
            const component = state.registeredComponentsConfig.find(c => c.id === payload.id);
            if (component) component.show = payload.show;
        },
        batchUpdateComponentsVisibility: (state, { payload }: PayloadAction<{
            componentIds: ComponentId[];
            show: boolean;
        }>) => {
            const { componentIds, show } = payload;
            const idsSet = new Set(componentIds);

            state.registeredComponentsConfig.forEach(component => {
                if (idsSet.has(component.id)) {
                    component.show = show;
                }
            });
        },
        updatePropsOfComponent: (state, { payload }: PayloadAction<{ id: ComponentId; props: Record<string, unknown> }>) => {
            const component = state.registeredComponentsConfig.find(c => c.id === payload.id);
            if (component) component.props = payload.props;
        },
    }
});

export const {
    setClassName,
    updatePositionIndex,
    reorderComponents,
    toggleComponentsComponentShow,
    batchUpdateComponentsVisibility,
    updatePropsOfComponent
} = sidebarSlice.actions;

export default sidebarSlice.reducer;