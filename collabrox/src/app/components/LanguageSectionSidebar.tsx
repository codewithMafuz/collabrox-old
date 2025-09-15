import { memo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Typography from '../common/Typography'
import ComponentWrapper from '../common/ComponentWrapper'
import { RootState } from '../../store/store'
import WrapperButton from '../common/WrapperButton'
import { MdOutlineEdit } from 'react-icons/md'
import Modal from '../common/Modal'
import SpanBadge from '../common/SpanBadge'
import Button from '../common/Button'
import Input from '../common/Input'

const LanguageSectionSidebar = memo(() => {
    const dispatch = useDispatch()

    const languages = useSelector((state: RootState) => state.person.languages)

    const [showLangSettings, setShowLangSettings] = useState(false)
    const [addableLangName, setAddableLangName] = useState('')

    return (
        <>
            {/* Language settings edit box */}
            <Modal
                isOpen={showLangSettings}
                title='Profile language settings'
                cancelBtnTxt='Cancel'
                showConfirmBtn={false}
                showCancelBtn={false}
                onCancel={() => setShowLangSettings(false)}
                onClose={() => setShowLangSettings(false)}
            >
                <div className='w-full p-3'>
                    <Typography variant='title'>Languages</Typography>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {languages?.map(lang =>
                            <SpanBadge col='light'>{lang}</SpanBadge>
                        )}
                    </div>
                </div>
                <div className='ml-3'>
                    <Input
                        col='light'
                        sz='md'
                        className='!w-[200px] my-2'
                        rounded='full'
                        onChange={(ev) => setAddableLangName(ev.currentTarget.value)}
                    />
                    {languages && languages.length <= 5 &&
                        <Button
                            col='dark'
                            onClick={() => {
                                
                            }}
                        >
                            Add
                        </Button>
                    }
                </div>
            </Modal>


            {/* Profile Language section box */}
            <ComponentWrapper id="language-sidebar-section" className="py-4 px-3">
                <div className="flex items-center justify-between mb-2">
                    <Typography variant='title'>Profile language</Typography>
                    <WrapperButton
                        tooltipConfig={{
                            content: 'Edit skill',
                            className: 'position-top',
                            arrowClassName: "bottomside-middle"
                        }}
                        className='hover:bg-gray-100'
                        sz='md'
                        onClick={() => setShowLangSettings(true)}
                    >
                        <MdOutlineEdit />
                    </WrapperButton>
                </div>
                <Typography variant='p'>{languages?.join(', ')}</Typography>
            </ComponentWrapper>
        </>
    )
})

export default LanguageSectionSidebar
