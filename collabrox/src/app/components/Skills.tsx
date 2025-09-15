import { useState, useEffect, Fragment, useRef } from 'react';
import { MdAdd, MdOutlineEdit, MdDeleteOutline, MdExpandMore, MdExpandLess } from "react-icons/md";
import { SkillItem, useAddSkillMutation, useGetSkillsAndExperiencesQuery, useRemoveSkillMutation, useUpdateSkillPropertiesMutation } from '../../apis/personApi';
import { useDispatch, useSelector } from 'react-redux';
import { setToast } from '../../toastSlice';
import Typography from '../common/Typography';
import ComponentWrapper from '../common/ComponentWrapper';
import { RootState } from '../../store/store';
import WrapperButton from '../common/WrapperButton';
import { setPersonData } from '../pages/person/personSlice';
import CusotmHr from '../common/CustomHr';
import ImageBox from '../common/ImageBox';
import { classNames } from '../../lib/StringUtils';
import Link from '../common/Link';
import { APIResponseTemplate } from '../../apis/userApi';
import { useParams } from 'react-router-dom';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';


const LoadingTemplate = () => {
    return (
        <div className='w-full min-h-32 my-3 flex items-center justify-center'>
            <Spinner />
        </div>
    )
}

export default function Skills({ selectedSkills = [] }: { selectedSkills?: string[] }) {
    const dispatch = useDispatch();

    const { username = '' } = useParams()

    const { isSelfProfile, skills = [] } = useSelector((state: RootState) => state.person);

    const { data: response, isLoading } = useGetSkillsAndExperiencesQuery({ username }, { skip: !username })

    useEffect(() => {
        if (!isLoading && response?.status === 'OK') {
            const { skills, experiences } = response.data!
            dispatch(setPersonData({ skills, experiences }))
        }
    }, [isLoading])

    const [addSkill] = useAddSkillMutation();
    const [removeSkill] = useRemoveSkillMutation();
    const [updateSkill] = useUpdateSkillPropertiesMutation();

    const skillsUnexpandedLimit = 7
    const [editBoxDetails, setEditBoxDetails] = useState<SkillItem | null>(null);
    const [showEditBox, setShowEditBox] = useState<boolean>(false);
    const [currentStage, setCurrentStage] = useState<'edit' | 'remove' | 'add' | null>(null);
    const [skillNameInput, setSkillNameInput] = useState<string>("");
    const [detailsBoxInfo, setDetailsBoxInfo] = useState<SkillItem | null>(null);
    const [expandedSkillName, setExpandedSkillName] = useState<string | null>(null);
    const [showAllSkills, setShowAllSkills] = useState<boolean>(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!showEditBox) {
            setEditBoxDetails(null);
            setSkillNameInput("");
        }
    }, [skills]);

    const handleShowEditBox = (skill: SkillItem, stage: 'edit' | 'remove' | 'add') => {
        setEditBoxDetails(skill);
        setSkillNameInput(skill.skillName);
        setCurrentStage(stage);
        setShowEditBox(true);
    };

    useEffect(() => {
        if (showEditBox && inputRef.current && (currentStage === 'add' || currentStage === 'edit')) {
            setTimeout(() => { inputRef.current?.focus(); }, 50);
        }
    }, [showEditBox, currentStage]);

    const handleSaveChanges = async () => {
        if (!editBoxDetails) return;

        try {
            let response: APIResponseTemplate = { data: null, message: 'Request has not been sent', status: 'Failed' };
            const normalizedInput = skillNameInput.trim().toLowerCase();

            switch (currentStage) {
                case 'add':
                    if (skills.some(s => s.skillName.toLowerCase() === normalizedInput)) {
                        dispatch(setToast({ content: "Skill already exists", toastOptions: { type: 'error' } }));
                        return;
                    }
                    response = await addSkill({
                        skillName: skillNameInput.trim(),
                        testScore: editBoxDetails.testScore,
                        showScore: editBoxDetails.showScore,
                        showExpRef: editBoxDetails.showExpRef
                    }).unwrap();
                    break;

                case 'remove':
                    response = await removeSkill({
                        skillName: editBoxDetails.skillName
                    }).unwrap();
                    break;

                case 'edit':
                    const existingSkill = skills.find(s =>
                        s.skillName.toLowerCase() === normalizedInput &&
                        s.skillName !== editBoxDetails.skillName
                    );

                    if (existingSkill) {
                        dispatch(setToast({ content: "Skill name already exists", toastOptions: { type: 'error' } }));
                        return;
                    }

                    response = await updateSkill({
                        oldSkillName: editBoxDetails.skillName,
                        newSkillName: skillNameInput.trim(),
                        testScore: editBoxDetails.testScore,
                        showScore: editBoxDetails.showScore,
                        showExpRef: editBoxDetails.showExpRef
                    }).unwrap();
                    break;
            }

            if (response.status === "OK") {
                dispatch(setPersonData({
                    skills: response.data.skills,
                    experiences: response.data.experiences,
                }));
                dispatch(setToast({ content: response.message, toastOptions: { type: 'success' } }));
            } else {
                dispatch(setToast({ content: response.message, toastOptions: { type: 'error' } }));
            }
        } catch (error) {
            console.error("Operation failed:", error);
            dispatch(setToast({ content: `Failed to ${currentStage}`, toastOptions: { type: 'error' } }));
        } finally {
            setShowEditBox(false);
        }
    };

    let displayedSkills = (showAllSkills ? skills : skills?.slice(0, skillsUnexpandedLimit) || []);
    if (selectedSkills?.length > 0) {
        displayedSkills = displayedSkills?.filter(obj => selectedSkills.map(s => s.toLowerCase()).includes(obj.skillName.toLowerCase())) || []
    }


    return (
        isLoading ?
            <LoadingTemplate />
            :
            !isSelfProfile && skills?.length === 0 ?
                null
                :
                <ComponentWrapper className={classNames('skillSection pt-2', skills.length <= skillsUnexpandedLimit ? 'pb-2' : '')}>
                    {/* top bar (head)*/}
                    <div className="topBar flex items-center justify-between p-1 w-full">
                        <Typography variant="subheading" className='pl-1'>Skills</Typography>
                        {isSelfProfile && selectedSkills.length === 0 && (
                            <WrapperButton
                                tooltipConfig={{
                                    content: 'Add skill',
                                    className: 'position-left lg:position-top',
                                    arrowClassName: "rightside-middle lg:bottomside-middle"
                                }}
                                sz='md'
                                onClick={() =>
                                    handleShowEditBox({
                                        skillName: '',
                                        testScore: 0,
                                        showScore: false,
                                        showExpRef: false
                                    }, 'add')
                                }
                            >
                                <MdAdd />
                            </WrapperButton>
                        )}
                    </div>

                    {/* skillbox */}
                    {skills.length > 0 ? (
                        <div className="skillBox">
                            {displayedSkills.map((skillObj, i) => {
                                const isExpanded = skillObj.skillName === expandedSkillName;
                                return (
                                    <Fragment key={i}>
                                        <div className="skillItem relative">
                                            {/* top part */}
                                            <div
                                                className="flex justify-between items-center px-2 lg:px-4 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                                                onClick={() => setExpandedSkillName(prev =>
                                                    prev === skillObj.skillName ? null : skillObj.skillName
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-3 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="lg:text-base font-[500] text-gray-900">
                                                            {skillObj.skillName}
                                                        </span>
                                                    </div>

                                                    {skillObj.showScore && (
                                                        <span className="bg-gray-200 text-gray-900 px-3 rounded-full text-sm">
                                                            {skillObj.testScore}% in assessment
                                                        </span>
                                                    )}
                                                </div>

                                                {isSelfProfile && selectedSkills.length === 0 && (
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <WrapperButton
                                                            tooltipConfig={{
                                                                content: isExpanded ? 'Collapse skill details' : 'Expand skill details',
                                                                className: 'position-left lg:position-top',
                                                                arrowClassName: "rightside-middle lg:bottomside-middle"
                                                            }}
                                                            className="hover:bg-gray-100"
                                                            sz="ss"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedSkillName(prev =>
                                                                    prev === skillObj.skillName ? null : skillObj.skillName
                                                                );
                                                            }}
                                                        >
                                                            {isExpanded ? <MdExpandLess /> : <MdExpandMore />}
                                                        </WrapperButton>

                                                        <WrapperButton
                                                            tooltipConfig={{
                                                                content: 'Edit skill',
                                                                className: 'position-top',
                                                                arrowClassName: "bottomside-middle"
                                                            }}
                                                            className='hover:bg-gray-100'
                                                            sz='ss'
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleShowEditBox(skillObj, 'edit');
                                                            }}
                                                        >
                                                            <MdOutlineEdit />
                                                        </WrapperButton>

                                                        <WrapperButton
                                                            tooltipConfig={{
                                                                content: 'Remove skill',
                                                                className: 'position-left lg:position-top',
                                                                arrowClassName: "rightside-middle lg:bottomside-middle"
                                                            }}
                                                            className='hover:bg-gray-100'
                                                            sz='ss'
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleShowEditBox(skillObj, 'remove');
                                                            }}
                                                        >
                                                            <MdDeleteOutline />
                                                        </WrapperButton>
                                                    </div>
                                                )}
                                            </div>

                                            {/* bottom part - Expanded section */}
                                            <div
                                                className={`skillDetails ${isExpanded ? 'h-auto pb-4' : 'h-0'} select-none px-8 transition-height duration-300 ease-in-out overflow-hidden`}
                                            >
                                                {isSelfProfile && selectedSkills.length === 0 && (
                                                    <button
                                                        className={`${isExpanded ? 'h-auto' : 'h-0'} overflow-hidden text-sm font-[600] text-indigo-500 hover:underline hover:text-indigo-600 py-0.5 mb-3 transition-colors`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDetailsBoxInfo(skillObj);
                                                        }}
                                                    >
                                                        {`Do collabrox skill test${skillObj.testScore && skillObj.testScore > 0 ? ' again' : ''}`}
                                                    </button>
                                                )}
                                                <div className="grid grid-cols-1">
                                                    {skillObj.references && skillObj.references.length > 0 ? (
                                                        skillObj.references!.map((ref, refIndex) => (
                                                            <Link
                                                                to={ref.companyId ? `/company/${ref.companyId}` : ''}
                                                                key={`${ref.experienceId}-${refIndex}`}
                                                                replace={false}
                                                                className="flex items-center gap-3 hover:border-blue-200 transition-colors cursor-pointer my-1 group w-fit"
                                                            >
                                                                <ImageBox
                                                                    imgSrc={ref.companyLogo}
                                                                    alt={ref.companyName}
                                                                    height="26px"
                                                                    width="26px"
                                                                    className="group-hover:underline"
                                                                />

                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-900 truncate group-hover:underline">
                                                                        {ref.companyName}
                                                                    </p>
                                                                </div>
                                                            </Link>
                                                        ))

                                                    ) : (
                                                        <Typography variant="p" className="text-gray-600">
                                                            No references to display.
                                                        </Typography>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {i !== displayedSkills.length - 1 && <CusotmHr className="!my-0" />}
                                    </Fragment>
                                )
                            })}
                        </div>
                    )
                        : (
                            <Typography variant='p' className="text-gray-600 text-center py-3">No skill to display</Typography>
                        )}

                    {/* Show more button */}
                    {skills.length > skillsUnexpandedLimit && (
                        <div
                            className="flex text-center w-full justify-between items-center px-2 md:px-8 lg:px-10 py-3 bg-gray-100 hover:bg-gray-300 transition-colors cursor-pointer pb-5"
                            onClick={() => setShowAllSkills(prev => !prev)}
                        >
                            <div className="flex items-center justify-between gap-3 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="lg:text-base font-[600] text-gray-900">
                                        {showAllSkills ? 'Show less' : 'Show more'}
                                    </span>
                                </div>
                                <WrapperButton
                                    tooltipConfig={{
                                        content: showAllSkills ? 'Collapse skills' : 'Expand skills',
                                        className: 'position-left',
                                        arrowClassName: "rightside-middle"
                                    }}
                                    className="hover:bg-gray-100"
                                    sz="xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAllSkills(prev => !prev);
                                    }}
                                >
                                    {showAllSkills ? <MdExpandLess /> : <MdExpandMore />}
                                </WrapperButton>
                            </div>
                        </div>
                    )}

                    {/* skill edit box */}
                    {showEditBox && editBoxDetails && (
                        <Modal
                            isOpen={true}
                            title={currentStage === 'edit' ? 'Edit Skill' : currentStage === 'remove' ? 'Remove Skill' : 'Add Skill'}
                            cancelBtnTxt='Cancel'
                            confirmBtnTxt={currentStage === 'remove' ? 'Confirm' : currentStage === 'edit' ? 'Save' : 'Add'}
                            onCancel={() => setShowEditBox(false)}
                            onClose={() => setShowEditBox(false)}
                            onConfirm={handleSaveChanges}
                            confirmBtnColor={currentStage === 'remove' ? 'danger' : 'primary'}
                            cancelBtnColor="light"
                        >
                            {currentStage === 'remove' ?
                                <Typography variant='subtitle'><span className='font-[600] pl-4'>Skill name :</span> {editBoxDetails.skillName}</Typography>
                                :
                                (
                                    <div className="flex flex-col items-start sm:w-full">
                                        <input
                                            type="text"
                                            ref={inputRef}
                                            value={skillNameInput}
                                            onChange={(ev) => setSkillNameInput(ev.target.value)}
                                            placeholder="Skill Name"
                                            className="w-full py-2 px-2 rounded-full border border-gray-400 my-2"
                                        />
                                        <label className='sm:w-full select-none'>
                                            <input
                                                type="checkbox"
                                                checked={editBoxDetails?.showScore}
                                                onChange={(ev) => setEditBoxDetails({ ...editBoxDetails, showScore: ev.target.checked })}
                                                className='ml-2'
                                            />
                                            {' Show Test Score'}
                                        </label>
                                        <label className='sm:w-full select-none'>
                                            <input
                                                type="checkbox"
                                                checked={editBoxDetails?.showExpRef}
                                                onChange={(ev) => setEditBoxDetails({ ...editBoxDetails, showExpRef: ev.target.checked })}
                                                className='ml-2'
                                            />
                                            {' Show experience reference'}
                                        </label>
                                    </div>
                                )}
                        </Modal>
                    )}

                    {/* skill details box */}
                    {detailsBoxInfo && (
                        <Modal
                            isOpen={true}
                            title={detailsBoxInfo.skillName}
                            height={400}
                            showConfirmBtn={false}
                            cancelBtnTxt='Close'
                            onCancel={() => setDetailsBoxInfo(null)}
                            onClose={()=> setDetailsBoxInfo(null)}
                        >
                            <div className="flex flex-col w-full px-1 sm:px-2 md:px-3 lg:px-4 xl:px-5 gap-2">
                                <div className="flex justify-between">
                                    <Typography variant='subtitle'>Scored in assessment</Typography>
                                    <Typography variant='subtitle'>{detailsBoxInfo.testScore}%</Typography>
                                </div>
                                {isSelfProfile && selectedSkills.length === 0 &&
                                    <button className="mt-5 px-2 mx-3 py-0.5 rounded-full bg-indigo-500 text-gray-100 hover:bg-indigo-600 transition-colors">Test Skill Now</button>
                                }
                            </div>
                        </Modal>
                    )}
                </ComponentWrapper>
    );
}