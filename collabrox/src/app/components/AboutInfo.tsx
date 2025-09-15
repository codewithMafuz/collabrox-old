import { useEffect, useMemo, useState } from 'react';
import Typography from '../common/Typography';
import { useGetAboutQuery, useUpdateAboutMutation } from '../../apis/personApi';
import { useDispatch, useSelector } from 'react-redux';
import EditableTextBox, { getRestoredCompressedFormatHTML } from '../common/EditableTextBox';
import ComponentWrapper from '../common/ComponentWrapper';
import { RootState } from '../../store/store';
import WrapperButton from '../common/WrapperButton';
import { setPersonData } from '../pages/person/personSlice';
import TextHTMLToHTML from './TextHTMLToHTML';
import { MdClose, MdOutlineEdit } from 'react-icons/md';
import { classNames } from '../../lib/StringUtils';
import { useParams } from 'react-router-dom';
import useShowToast from '../../hooks/useShowToast';


const LoadingTemplate = () => {
    return (
        <div className="my-3 mx-3">
            <div className='bg-light-200 animate-pulse h-[140px] rounded-sm'>
            </div>
        </div>
    )
}

function AboutInfo() {
    const { username = '' } = useParams<{ username: string }>();

    const { data: response, isLoading } = useGetAboutQuery({ username }, { skip: !username });
    const about = response?.data?.about || '';

    const dispatch = useDispatch();
    const showToast = useShowToast()

    const loggedinUsername = useSelector((state: RootState) => state.user.username);
    const isSelfProfile = useSelector((state: RootState) => state.person.isSelfProfile);

    const [updateAbout, { isLoading: isSaving }] = useUpdateAboutMutation();

    const [editStage, setEditStage] = useState<boolean>(false);

    const initialHTML = useMemo(() => ({
        compressed: about,
        normal: getRestoredCompressedFormatHTML(about || ''),
    }), [about]);

    const [updatedCompressedHTML, setUpdatedCompressedHTML] = useState<string | null>(initialHTML.compressed);
    const [updatedHTML, setUpdatedHTML] = useState<string | null>(initialHTML.normal);

    const [savedCompressedHTML, setSavedCompressedHTML] = useState<string | null>(initialHTML.compressed);
    const [savedHTML, setSavedHTML] = useState<string | null>(initialHTML.normal);

    useEffect(() => {
        setSavedHTML(initialHTML.normal);
        setSavedCompressedHTML(initialHTML.compressed);
    }, [initialHTML]);

    const handleSave = async () => {
        try {
            if (updatedCompressedHTML === savedCompressedHTML) {
                return showToast('No changed to save', 'info')
            }

            const response = await updateAbout({ about: updatedCompressedHTML || '' }).unwrap();

            if (response.status === 'OK') {
                dispatch(setPersonData({ about: updatedCompressedHTML! }));

                setSavedCompressedHTML(updatedCompressedHTML);
                setSavedHTML(updatedHTML);
                setEditStage(false);

                return showToast(response.message, 'success')
            }

            showToast(response.message, 'error');
        } catch (error) {
            console.error('Error in handleSave :', error)
            showToast('Failed to save changes')
        }
    };

    return (
        isLoading ?
            <LoadingTemplate />
            :
            !isSelfProfile && !about ?
                null
                :
                <ComponentWrapper className="about py-2">
                    <div className="topBar flex items-center justify-between p-1 w-full">
                        <Typography variant="subheading" className='pl-1 lg:pl-3 font-["quicksand",sans-serif]'>
                            About
                        </Typography>
                        {loggedinUsername && isSelfProfile && (
                            <>
                                {editStage ? (
                                    <WrapperButton
                                        tooltipConfig={{
                                            content: "Close editing",
                                            className: "position-left",
                                            arrowClassName: "rightside-middle",
                                        }}
                                        sz="md"
                                        onClick={() => setEditStage(false)}
                                    >
                                        <MdClose />
                                    </WrapperButton>
                                ) : (
                                    <WrapperButton
                                        tooltipConfig={{
                                            content: "Edit about",
                                            className: "position-left",
                                            arrowClassName: "rightside-middle",
                                        }}
                                        sz="md"
                                        onClick={() => setEditStage(true)}
                                    >
                                        <MdOutlineEdit />
                                    </WrapperButton>
                                )}
                            </>
                        )}
                    </div>

                    {editStage ? (
                        <>
                            <div className="m-3">
                                <EditableTextBox
                                    id="editableDivInAbout"
                                    initialHTML={savedCompressedHTML || ''}
                                    onContentChange={({ HTML, compressedHTML = '' }) => {
                                        setUpdatedHTML(HTML);
                                        setUpdatedCompressedHTML(compressedHTML);
                                    }}
                                    creditLimit={2000}
                                    placeHolder="Brief description about you"
                                />
                            </div>

                            <div className="flex items-center justify-center mt-3 mb-1">
                                <button
                                    onClick={handleSave}
                                    className={classNames(
                                        'bg-gray-900 text-gray-200 px-3 py-0.5 rounded-[20px] hover:bg-gray-800 cursor-pointer',
                                        isSaving ? 'animate-pulse' : ''
                                    )}
                                >
                                    Save
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            {savedCompressedHTML ? (
                                <TextHTMLToHTML
                                    className="px-1 md:px-2 lg:px-3 py-1 lg:py-2 text-left text-[.9rem] lg:text-[.95rem] rounded-lg w-full h-auto"
                                    textHTML={savedHTML || ''}
                                    linksClickable={true}
                                />
                            ) : (
                                <div className="flex items-center justify-center py-3 text-center">
                                    <Typography variant="p" className="text-gray-600 text-center py-3">
                                        No about added
                                    </Typography>
                                </div>
                            )}
                        </>
                    )}
                </ComponentWrapper>
    );
}

export default AboutInfo;