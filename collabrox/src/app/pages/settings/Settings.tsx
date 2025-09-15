import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../../store/store'
import { useParams } from 'react-router-dom'
import SettingGeneral from '../../components/SettingGeneral'
import React, { useEffect, useMemo, useState } from 'react';
import SettingAccount from '../../components/SettingAccount';
import { useNavigateCustom } from '../../../hooks/useNavigateCustom';
import { MdAccountCircle, MdSettings } from 'react-icons/md';
import { capitalize } from '../../../lib/StringUtils';
import PageWrapper from '../../shared/PageWrapper';
import ComponenetWrapper from '../../common/ComponentWrapper';

export interface SettingUserProps {
    _id: string;
    name: string;
    username: string;
    profileSrc: any;
    banner?: any;
    person?: any;
    [key: string]: any;
}
export type SettingTabType = 'general' | 'account'
export const settingTabs: { name: SettingTabType, Icon: React.ElementType }[] = [
    { name: 'general', Icon: MdSettings },
    { name: 'account', Icon: MdAccountCircle },
]

const settingTabsComponents: Record<SettingTabType, React.ElementType> = {
    general: SettingGeneral,
    account: SettingAccount,
}

const isSettingTab = (tabName: string): tabName is SettingTabType => settingTabs.some(o => o.name === tabName)


const Settings = () => {
    const dispatch = useDispatch()
    const { tab: tabParam } = useParams()
    const navigate = useNavigateCustom()

    const isAuthenticated = useSelector((state: RootState) => state.user.username)
    const user = useSelector((state: RootState) => state.user)
    const [currentTabInfo, setCurrentTabInfo] = useState<{ name: SettingTabType, Component: React.ElementType } | undefined>(undefined)

    const SettingTabsBoxComponent = useMemo(() => (
        <ComponenetWrapper className="settingTabs flex flex-col items-start justify-center w-full">
            {
                currentTabInfo &&
                settingTabs.some(o => o.name === currentTabInfo.name) &&
                settingTabs.map(({ name, Icon }, index) =>
                    <button key={index}
                        tabIndex={index}
                        onClick={() => {
                            navigate({ url: `/settings?tab=${name}` })
                        }}
                        className={`relative w-full h-[40px] shadow-sm flex items-center justify-start pl-2 hover:bg-indigo-300 transition-all${currentTabInfo.name === name ? ' bg-indigo-300' : ''}`}>
                        {currentTabInfo.name === name &&
                            <div className="absolute w-3 h-full bg-indigo-500 top-0 left-0"></div>
                        }
                        <span>{capitalize(name)}</span>
                        <Icon className='text-[1.1rem]' />
                    </button>
                )
            }
        </ComponenetWrapper>
    ), [currentTabInfo])



    // useEffect(() => {
    //     if (isAuthenticated?._id) {
    //         dispatch(setCurrentChildren(SettingTabsBoxComponent))
    //     }
    // }, [isAuthenticated, SettingTabsBoxComponent])

    useEffect(() => {
        if (tabParam && isSettingTab(tabParam)) {
            setCurrentTabInfo({
                name: tabParam,
                Component: settingTabsComponents[tabParam]
            })
        }
    }, [tabParam])


    return (
        <PageWrapper id='settings'>
            {(isAuthenticated && user?._id && currentTabInfo?.Component) &&
                <currentTabInfo.Component
                    user={user}
                />}
        </PageWrapper>
    )
}

export default Settings
