import { useState, useEffect, useRef } from 'react';
import { MdAdd, MdDeleteOutline, MdOutlineDiamond, MdOutlineEdit } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import QuickBox from '../shared/QuickBox';
import { useAddExperienceMutation, useUpdateExperienceMutation, useRemoveExperienceMutation, ExperienceRoleItem, ExperienceItem, LocationType, EmploymentType, useGetSkillsAndExperiencesQuery } from '../../apis/personApi';
import Typography from '../common/Typography';
import { setToast } from '../../toastSlice';
import Flatpickr from "react-flatpickr";
import 'flatpickr/dist/themes/dark.css';
import EditableTextBox, { getRestoredCompressedFormatHTML } from '../common/EditableTextBox';
import ComponentWrapper from '../common/ComponentWrapper';
import CusotmHr from '../common/CustomHr';
import { RootState } from '../../store/store';
import WrapperButton from '../common/WrapperButton';
import { setPersonData } from '../pages/person/personSlice';
import ImageBox from '../common/ImageBox';
import ShowMoreText from '../shared/ShowMoreText';
import Tooltip from '../common/ToolTip';
import Link from '../common/Link';
import { useNavigateCustom } from '../../hooks/useNavigateCustom';
import { APIResponseTemplate } from '../../apis/userApi';
import { useParams } from 'react-router-dom';
import Spinner from '../common/Spinner';
import Skills from './Skills';
import Modal from '../common/Modal';

interface ExperienceFormRoleItemType {
    titleOfRole: string;
    employmentType: string;
    location: string;
    locationType: string;
    summary?: string;
    fromDateMs: number;
    toDateMs?: number | 'Current';
    skills?: string[];
}
interface ExperienceFullFormType extends ExperienceFormRoleItemType {
    companyName: string;
    companyLogo?: string;
    companyId?: string;

    roleIndex?: number; // role index is not required only when adding a fresh/reset experience form data
}

const dayToMS = (day: number) => day * 24 * 60 * 60 * 1000

const formatDate = (dateMs: number | 'Current') => {
    if (dateMs === 'Current') return dateMs;
    return new Date(dateMs).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

const calculateDuration = (from: number, to: number | 'Current') => {
    const endDate = new Date(to === 'Current' ? Date.now() : to);
    const startDate = new Date(from);
    const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth());
    return `${Math.floor(months / 12)} yr ${months % 12} mos`.replace('0 yr ', '');
};

const calculateTotalDuration = (roles: ExperienceRoleItem[]) => {
    let totalMonths = 0;

    roles.forEach(({ fromDateMs, toDateMs }) => {
        const endDate = toDateMs === "Current" ? new Date() : new Date(toDateMs || Date.now());
        const startDate = new Date(fromDateMs);

        totalMonths +=
            (endDate.getFullYear() - startDate.getFullYear()) * 12 +
            (endDate.getMonth() - startDate.getMonth());
    });

    return `${Math.floor(totalMonths / 12)} yr ${totalMonths % 12} mos`.replace('0 yr ', '');
};

const formatSkillsToStr = (skills: string[], maxLength: number = 80) => {
    if (!skills?.length) return "";

    let formatted = "", i = 0;
    while (i < skills.length && (formatted + (formatted ? ", " : "") + skills[i]).length <= maxLength) {
        formatted += (formatted ? ", " : "") + skills[i++];
    }

    const remaining = skills.length - i;
    return remaining > 0 ? `${formatted} and +${remaining} skills` : formatted;
};

const makeMissedAlertToField = (fieldName: keyof ExperienceFullFormType) => {
    const element = document.getElementById(fieldName);
    if (element) {
        element.classList.add('border-red-500');
    }
};

const removeMissedAlertFromField = (fieldName: keyof ExperienceFullFormType) => {
    const element = document.getElementById(fieldName);
    if (element) {
        element.classList.remove('border-red-500');
    }
};

const initialFormState: ExperienceFullFormType = {
    companyName: '',
    companyId: '',
    companyLogo: '',

    // below are roleItem required properties
    titleOfRole: '',
    employmentType: 'Full-time',
    location: '',
    locationType: 'Onsite',
    fromDateMs: Date.now() - dayToMS(100),
    toDateMs: 'Current'
};

type SelectedSkills = { companyName: string, roleName: string, skills: string[] }

const LoadingTemplate = () => {
    return (
        <div className='w-full min-h-32 my-3 flex items-center justify-center'>
            <Spinner />
        </div>
    )
}

const Experience = () => {
    const dispatch = useDispatch();

    const { username = '' } = useParams()

    const { data: response, isLoading } = useGetSkillsAndExperiencesQuery({ username }, { skip: !username })

    useEffect(() => {
        if (!isLoading && response?.status === 'OK') {
            const { skills, experiences } = response.data!
            dispatch(setPersonData({ skills, experiences }))
        }
    }, [isLoading])

    const { isSelfProfile, experiences = [] } = useSelector((state: RootState) => state.person);

    const [formData, setFormData] = useState<ExperienceFullFormType>(initialFormState);

    const [addExperience] = useAddExperienceMutation();
    const [updateExperience] = useUpdateExperienceMutation();
    const [removeExperience] = useRemoveExperienceMutation();

    const [mandatoryFieldsToCheck] = useState({
        companyName: 'Company name',
        titleOfRole: 'Title',
        employmentType: 'Employment type',
        location: 'Location',
        locationType: 'Location type',
    });
    const [selectedExperience, setSelectedExperience] = useState<ExperienceFullFormType | null>(null);
    const [formExperienceId, setFormExperienceId] = useState<string>();
    const [disableCompanyFormData, setDisableCompanyFormData] = useState<boolean>(false)

    const [showAddBox, setShowAddBox] = useState<boolean>(false);
    const [showEditBox, setShowEditBox] = useState<boolean>(false);
    const [showDeleteBox, setShowDeleteBox] = useState<boolean>(false);

    const [showSelectedSkills, setShowSelectedSkills] = useState<boolean | SelectedSkills>(false)

    const [removeFromSkills, setRemoveFromSkills] = useState<boolean>(false)
    const [currentChecked, setCurrentChecked] = useState<boolean>(true);

    const [newSkillInput, setNewSkillInput] = useState<string>('');

    const summaryBoxRef = useRef<{ reInitializeHTML: (compressedHTML: string) => void }>(undefined);
    const navigate = useNavigateCustom();

    useEffect(() => {
        if (selectedExperience) {
            setFormData(selectedExperience);
            setCurrentChecked(!selectedExperience.toDateMs || selectedExperience.toDateMs === 'Current');
        }
    }, [selectedExperience]);

    const handleFormChange = (field: keyof ExperienceFullFormType, value: string | EmploymentType | LocationType | string[] | number) => {
        removeMissedAlertFromField(field);
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleDateChange = (dates: Date[], field: 'fromDateMs' | 'toDateMs') => {
        if (dates.length > 0) {
            handleFormChange(field, dates[0].getTime());
        }
    };

    const handleAddSkill = () => {
        const skillName = newSkillInput.trim();
        if (!skillName) return;

        const formDataSkills = formData.skills || []
        const normalizedSkills = formDataSkills.map(s => s.toLowerCase()) || [];
        if (!normalizedSkills.includes(skillName.toLowerCase())) {
            handleFormChange('skills', [...formDataSkills, skillName]);
            setNewSkillInput('');
        }
    };

    const handleRemoveSkill = (skillName: string) => {
        if (formData.skills) handleFormChange('skills', formData.skills.filter(s => s !== skillName));
    };

    const handleSubmit = async () => {
        try {
            const missedField = Object.keys(mandatoryFieldsToCheck).find((field): field is keyof typeof mandatoryFieldsToCheck => !formData.hasOwnProperty(field));

            if (missedField) {
                makeMissedAlertToField(missedField);
                dispatch(setToast({
                    content: `Please fill required fields correctly "${mandatoryFieldsToCheck[missedField]}"`,
                    toastOptions: { type: 'error' }
                }));
                return;
            }

            const editOperation = showEditBox;

            // Cleaning and formatting data
            const experiencePayload = {
                ...formData,
                skills: Array.from(new Set(formData.skills?.map(s => s.trim())) || []),
                toDateMs: currentChecked ? 'Current' : (formData.toDateMs || 'Current'),
            };

            let response: APIResponseTemplate;
            if (editOperation) {
                response = await updateExperience({
                    experienceId: formExperienceId,
                    ...experiencePayload,
                }).unwrap();
            } else {
                response = await addExperience(experiencePayload).unwrap();
            }

            if (response.status === 'OK') {
                dispatch(setPersonData({ experiences: response.data.experiences, skills: response.data.skills }));
                setShowAddBox(false)
                setShowEditBox(false)
                setSelectedExperience(null);
                dispatch(setToast({
                    content: `Experience ${editOperation ? 'updated' : 'added'} successfully`,
                    toastOptions: { type: 'success' },
                }));
            }
        } catch (error) {
            console.error('Error in handleSubmit in experience', error);
            dispatch(setToast({
                content: 'Failed to save experience',
                toastOptions: { type: 'error' }
            }));
        }
    };

    const handleRemoveExperience = async () => {
        if (!formExperienceId) {
            dispatch(setToast({
                content: "No experience selected for deletion",
                toastOptions: { type: "error" }
            }));
            setShowDeleteBox(false)
            return;
        }

        try {
            const response: APIResponseTemplate = await removeExperience({
                experienceId: formExperienceId,
                titleOfRole: formData.titleOfRole,
                removeFromSkills
            }).unwrap();

            if (response.status === "OK") {
                dispatch(setPersonData({
                    experiences: response.data.experiences,
                    skills: response.data.skills
                }));
                dispatch(setToast({
                    content: response.message,
                    toastOptions: { type: "success" }
                }));
                setShowDeleteBox(false)
            }
        } catch (error) {
            dispatch(setToast({
                content: "Failed to remove experience",
                toastOptions: { type: "error" }
            }));
        }
    };

    return (
        isLoading ?
            <LoadingTemplate />
            :
            !isSelfProfile && experiences?.length === 0 ?
                null
                :
                <ComponentWrapper className="experienceSection py-2">
                    {/* Top bar (head) */}
                    <div className="topBar flex items-center justify-between p-1 w-full">
                        <div className="flex items-center justify-between w-full">
                            <Typography variant="subheading" className='pl-1'>Experience</Typography>

                            {isSelfProfile && (
                                <WrapperButton
                                    tooltipConfig={{
                                        content: "Add experience",
                                        className: 'position-left lg:position-top',
                                        arrowClassName: 'rightside-middle lg:bottomside-middle',
                                    }}
                                    sz="md"
                                    onClick={() => {
                                        setShowEditBox(false)
                                        setShowDeleteBox(false)
                                        setSelectedExperience(initialFormState)
                                        setShowAddBox(true)
                                        setTimeout(() => {
                                            summaryBoxRef.current?.reInitializeHTML('');
                                        }, 50);
                                        setDisableCompanyFormData(false)
                                    }}
                                >
                                    <MdAdd />
                                </WrapperButton>
                            )}
                        </div>
                    </div>
                    {/* No experience display message */}
                    {experiences.length === 0 &&
                        <Typography variant='p' className="text-gray-600 text-center py-3">No experience to display</Typography>
                    }

                    {/* Experiences List */}
                    <div className="experiences flex flex-col gap-4 px-1 md:px-2 pt-3">
                        {experiences.map((experienceObj: ExperienceItem, expIndex: number) => {
                            const isSingleRole = experienceObj.roles.length === 1;
                            const { experienceId, companyId, companyName, companyLogo, roles } = experienceObj;

                            return (
                                <div key={expIndex} className="experienceItem">
                                    {/* the top company info box if have multiple roles in same company */}
                                    {roles.length > 1 && (
                                        <div className="roleItem flex flex-row pb-3">
                                            <div className="left relative flex justify-center px-1 py-2 md:px-4 md:py-3">
                                                <Tooltip
                                                    content={companyName}
                                                    className="position-top"
                                                    arrowClassName="bottomside-middle"
                                                >
                                                    <Link
                                                        to={companyId ? `/company/${companyId}` : ''}>
                                                        <ImageBox
                                                            imgSrc={companyLogo}
                                                            alt={companyName}
                                                            height="46px"
                                                            width="46px"
                                                        />
                                                    </Link>
                                                </Tooltip>
                                            </div>
                                            <div className="right w-full">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h5 className="text-lg font-[500]">{companyName}</h5>
                                                    </div>
                                                    {isSelfProfile && (
                                                        <WrapperButton
                                                            tooltipConfig={{
                                                                content: "Add another role",
                                                                className: 'position-left',
                                                                arrowClassName: 'rightside-middle'
                                                            }}
                                                            sz="xs"
                                                            onClick={() => {
                                                                setShowEditBox(false)
                                                                setShowDeleteBox(false)
                                                                setSelectedExperience({
                                                                    ...initialFormState,
                                                                    companyName,
                                                                    companyId,
                                                                    companyLogo
                                                                });
                                                                setShowAddBox(true)
                                                                setTimeout(() => {
                                                                    summaryBoxRef.current?.reInitializeHTML('');
                                                                }, 50);
                                                                setDisableCompanyFormData(true)
                                                            }}
                                                        >
                                                            <MdAdd />
                                                        </WrapperButton>
                                                    )}
                                                </div>
                                                <p className="text-sm font-[400] text-gray-900">
                                                    <span>{experienceObj.roles[0].employmentType}</span>
                                                    <span> · </span>
                                                    <span>{calculateTotalDuration(roles)}</span>
                                                </p>
                                                <p className="text-sm font-[300] text-gray-700">
                                                    <span>{roles[0].location}</span>
                                                    <span> · </span>
                                                    <span>{roles[0].locationType}</span>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* roles */}
                                    {roles.map((roleItem, roleIndex) => (
                                        <div
                                            key={roleIndex}
                                            className={`roleItem flex flex-row ${isSingleRole ? '' : 'ml-[30px]'}`}
                                        >
                                            {/* Left Side (Image/Connector) */}
                                            <div className="left relative h-auto px-1 py-2 md:px-4 md:py-3">
                                                {isSingleRole ? (
                                                    <Tooltip
                                                        content={companyName}
                                                        className="position-top"
                                                        arrowClassName="bottomside-middle"
                                                    >
                                                        <Link
                                                            to={companyId ? `/company/${companyId}` : ''}>
                                                            <ImageBox
                                                                onClick={() => navigate({ url: `/company/${companyId}` })}
                                                                imgSrc={companyLogo}
                                                                alt={companyName}
                                                                height="46px"
                                                                width="46px"
                                                            />
                                                        </Link>
                                                    </Tooltip>
                                                ) : (
                                                    <>
                                                        <div className="absolute top-[10px] left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full w-[10px] h-[10px]" />
                                                        {roleIndex !== roles.length - 1 && (
                                                            <div className="absolute top-[25px] left-1/2 transform -translate-x-1/2 bg-gray-300 rounded-full w-[2px] h-[calc(100%-25px)]" />
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            {/* Right Side (Role Details) */}
                                            <div className={`right w-full pb-[24px]${roles.length > 1 ? ' pl-[24px]' : ''}`}>
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h5 className="text-lg font-[500] flex-1">{roleItem.titleOfRole}</h5>
                                                    </div>
                                                    {/* Icons (add, edit, remove) - if own profile */}
                                                    {isSelfProfile &&
                                                        <div className="icons flex items-center justify-center gap-2">
                                                            {roles.length === 1 &&
                                                                <WrapperButton
                                                                    tooltipConfig={{
                                                                        content: "Add another role in this company",
                                                                        className: 'position-left lg:position-top',
                                                                        arrowClassName: 'rightside-middle lg:bottomside-middle',
                                                                    }}
                                                                    sz="xs"
                                                                    onClick={() => {
                                                                        setShowEditBox(false)
                                                                        setShowDeleteBox(false)
                                                                        setSelectedExperience({
                                                                            ...initialFormState,
                                                                            companyName,
                                                                            companyId,
                                                                            companyLogo
                                                                        });
                                                                        setShowAddBox(true)
                                                                        setTimeout(() => {
                                                                            summaryBoxRef.current?.reInitializeHTML('');
                                                                        }, 50);
                                                                        setDisableCompanyFormData(true)
                                                                    }}
                                                                >
                                                                    <MdAdd />
                                                                </WrapperButton>
                                                            }
                                                            <WrapperButton
                                                                tooltipConfig={{
                                                                    content: 'Edit',
                                                                    className: 'position-top',
                                                                    arrowClassName: 'bottomside-middle',
                                                                }}
                                                                sz='xs'
                                                                onClick={() => {
                                                                    setShowAddBox(false)
                                                                    setShowDeleteBox(false)
                                                                    const { roleIndex, ...othersInRoleItem } = roleItem
                                                                    setSelectedExperience({
                                                                        ...initialFormState,
                                                                        companyName,
                                                                        companyLogo,
                                                                        roleIndex,
                                                                        ...othersInRoleItem
                                                                    })
                                                                    setFormExperienceId(experienceId)
                                                                    setShowEditBox(true)
                                                                    setTimeout(() => {
                                                                        summaryBoxRef.current?.reInitializeHTML(roleItem.summary || '');
                                                                    }, 50);
                                                                    setDisableCompanyFormData(false)
                                                                }}
                                                            >
                                                                <MdOutlineEdit />
                                                            </WrapperButton>
                                                            <WrapperButton
                                                                tooltipConfig={{
                                                                    content: "Remove",
                                                                    className: 'position-left lg:position-top',
                                                                    arrowClassName: 'rightside-middle lg:bottomside-middle',
                                                                }}
                                                                sz="xs"
                                                                onClick={() => {
                                                                    setShowAddBox(false)
                                                                    setShowEditBox(false)
                                                                    setSelectedExperience({
                                                                        ...initialFormState,
                                                                        titleOfRole: roles.length === 1 ? '' : roleItem.titleOfRole // valid titleOfRole indicates that only should be removed the title rather than full experience removal
                                                                    })
                                                                    setFormExperienceId(experienceId)
                                                                    setShowDeleteBox(true);
                                                                    setDisableCompanyFormData(false)
                                                                }}
                                                            >
                                                                <MdDeleteOutline />
                                                            </WrapperButton>
                                                        </div>
                                                    }
                                                </div>
                                                {/* Rest articles/info */}
                                                <p className="text-sm font-[500] text-gray-700">
                                                    {isSingleRole &&
                                                        <>
                                                            <span>{companyName}</span>
                                                            <span> · </span>
                                                        </>
                                                    }
                                                    <span>{roleItem.employmentType}</span>
                                                </p>
                                                <p className="text-sm font-[400] text-gray-700">
                                                    <span>
                                                        {formatDate(roleItem.fromDateMs)}
                                                        <span> · </span>
                                                        {formatDate(roleItem.toDateMs as number | 'Current')}
                                                    </span>
                                                    <span> · </span>
                                                    <span>{calculateDuration(roleItem.fromDateMs, roleItem.toDateMs as number | 'Current')}</span>
                                                </p>
                                                <p className="text-sm font-[400] text-gray-700">
                                                    <span>{roleItem.location}</span>
                                                    <span> · </span>
                                                    <span>{roleItem.locationType}</span>
                                                </p>
                                                {roleItem.summary && (
                                                    <div className='mt-3'>
                                                        <ShowMoreText
                                                            className='text-sm text-gray-900'
                                                            textHTML={getRestoredCompressedFormatHTML(roleItem.summary)}
                                                            lines={2}
                                                        />
                                                    </div>
                                                )}
                                                {roleItem.skills && roleItem.skills.length > 0 && (
                                                    <button
                                                        onClick={() =>
                                                            setShowSelectedSkills({
                                                                companyName,
                                                                roleName: roleItem.titleOfRole,
                                                                skills: roleItem.skills!
                                                            })}
                                                        className='flex items-center justify-center gap-1 text-sm font-[600] hover:underline mt-3'>
                                                        <MdOutlineDiamond />
                                                        {formatSkillsToStr(roleItem.skills, 60)}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {expIndex !== experiences.length - 1 && <CusotmHr variant="thin" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Experience Form */}
                    <QuickBox
                        show={showAddBox || showEditBox}
                        topBarTitle={`${showAddBox ? 'Add' : 'Edit'} Experience`}
                        onClose={() => {
                            setShowAddBox(false)
                            setShowEditBox(false)
                            setShowDeleteBox(false)
                            setSelectedExperience(null)
                        }}
                    >
                        <div id='form' className="flex flex-col justify-center gap-3 w-full px-2 md:px-4 lg:px-6 pt-3 pb-10">
                            {/* Company */}
                            <div className="w-full md:w-[70%] lg:w-[50%]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company/Organization *</label>
                                <input
                                    disabled={disableCompanyFormData}
                                    id='companyName'
                                    value={formData.companyName}
                                    onChange={(e) => handleFormChange('companyName', e.target.value)}
                                    required
                                    className="input-field w-full py-1 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
                                />
                            </div>

                            {/* Title */}
                            <div className="w-full md:w-[70%] lg:w-[50%]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                <input
                                    id='titleOfRole'
                                    value={formData.titleOfRole}
                                    onChange={(e) => handleFormChange('titleOfRole', e.target.value)}
                                    required
                                    className="input-field w-full py-1 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
                                />
                            </div>
                            {/* Employment Type */}
                            <div className="w-full md:w-[70%] lg:w-[50%]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
                                <select
                                    id='employmentType'
                                    required
                                    value={formData.employmentType}
                                    onChange={(e) => handleFormChange('employmentType', e.target.value as EmploymentType)}
                                    className="input-field w-full py-1 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600 appearance-none"
                                >
                                    {["Full-time", "Part-time", "Self-employed", "Freelance", "Contract", "Internship", "Apprenticeship", "Seasonal"].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                            {/* Location and Location Type */}
                            <div className="w-full flex flex-col md:!flex-row items-center gap-0 md:gap-3 lg:gap-6 mt-2">
                                {/* Location */}
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                                    <input
                                        id='location'
                                        required
                                        value={formData.location}
                                        onChange={(e) => handleFormChange('location', e.target.value)}
                                        className="input-field w-full py-1 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600 transition-colors"
                                    />
                                </div>
                                {/* Location Type */}
                                <div className="w-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location Type *</label>
                                    <select
                                        id='locationType'
                                        required
                                        value={formData.locationType}
                                        onChange={(e) => handleFormChange('locationType', e.target.value as LocationType)}
                                        className="input-field w-full py-1 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600 appearance-none"
                                    >
                                        <option value="Onsite">Onsite</option>
                                        <option value="Hybrid">Hybrid</option>
                                        <option value="Remote">Remote</option>
                                    </select>
                                </div>
                            </div>
                            {/* From and To date */}
                            <div className="w-full flex flex-col md:!flex-row items-center gap-0 md:gap-3 lg:gap-6 mt-2">
                                {/* From Date */}
                                <div className="w-full space-y-1">
                                    <div className="block text-sm font-medium text-gray-700 mb-1">From *</div>
                                    <Flatpickr
                                        options={{
                                            dateFormat: 'F Y',
                                            defaultDate: new Date(formData.fromDateMs),
                                            maxDate: new Date(Date.now() - dayToMS(30)),
                                        }}
                                        onChange={(dates) => handleDateChange(dates, 'fromDateMs')}
                                        className="input-field w-full py-2 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600 bg-white"
                                    />
                                </div>
                                {/* To Date */}
                                <div className="w-full space-y-1">
                                    <div className="block text-sm font-medium text-gray-700">
                                        To
                                        {!currentChecked &&
                                            <label className='select-none text-sm'>
                                                <input
                                                    type="checkbox"
                                                    checked={currentChecked}
                                                    onChange={() => setCurrentChecked(true)}
                                                    className='ml-3 accent-indigo-600'
                                                />
                                                {' Current'}
                                            </label>
                                        }
                                    </div>
                                    {currentChecked ?
                                        <div className="w-full py-2 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600 bg-white flex items-center">
                                            <label className='select-none py-0.5 text-sm'>
                                                <input
                                                    type="checkbox"
                                                    checked={currentChecked}
                                                    onChange={() => setCurrentChecked(false)}
                                                    className='ml-3 accent-indigo-600'
                                                />
                                                {' Current'}
                                            </label>
                                        </div>
                                        :
                                        <Flatpickr
                                            className="w-full py-2 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600 bg-white"
                                            options={{
                                                dateFormat: 'F Y',
                                                defaultDate: new Date(typeof (formData.toDateMs) === 'number' ? formData.toDateMs : Math.min(formData.fromDateMs + dayToMS(90), Date.now())),
                                                minDate: new Date(formData.fromDateMs),
                                                maxDate: new Date(),
                                            }}
                                            onChange={(dates) => handleDateChange(dates, 'toDateMs')}
                                            disabled={currentChecked}
                                        />
                                    }
                                </div>
                            </div>
                            {/* Summary */}
                            <div className="w-full">
                                <label>Summary</label>
                                <EditableTextBox
                                    ref={summaryBoxRef}
                                    id="exp_summary"
                                    initialHTML={formData.summary || ''}
                                    creditLimit={1000}
                                    onContentChange={({ compressedHTML }) =>
                                        handleFormChange("summary", compressedHTML!)
                                    }
                                    placeHolder="Describe your role and achievements"
                                />
                            </div>
                            {/* Skills */}
                            <div className="md:w-[70%] lg:w-[50%]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                                <div className="flex flex-col items-start w-full">
                                    <div className="flex items-center gap-2 w-full mb-2">
                                        <input
                                            type="text"
                                            value={newSkillInput}
                                            onChange={(e) => setNewSkillInput(e.target.value)}
                                            placeholder="Add a skill (e.g., React)"
                                            className="flex-1 py-1 px-4 rounded-full border border-gray-400 focus:outline-none focus:border-gray-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddSkill}
                                            className="px-4 py-1 bg-indigo-600 text-gray-100 rounded-full hover:bg-indigo-700 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 w-full">
                                        {formData.skills?.map((skill, index) => (
                                            <div key={index} className="flex items-center px-3 py-1 bg-gray-100 rounded-full border border-gray-300">
                                                <span className="text-sm">{skill}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSkill(skill)}
                                                    className="ml-2 text-gray-500 hover:text-red-600"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Form Buttons */}
                            <div className="w-full flex justify-end gap-2 mt-10">
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    className="px-6 py-1 border-transparent border-[1px] bg-indigo-600 text-gray-100 rounded-full hover:bg-indigo-700 hover:border-indigo-900 transition-colors"
                                >
                                    {formExperienceId ? 'Save Changes' : 'Add Experience'}
                                </button>
                            </div>
                        </div>
                    </QuickBox>

                    {/* Details show of experience skills */}
                    <QuickBox
                        show={!!showSelectedSkills}
                        topBarTitle={`Details of skill`}
                        onClose={() => setShowSelectedSkills(false)}
                    >
                        <Typography variant='subtitle' className='px-2 md:px-4 lg:px-6 py-2'>
                            {'Skills details as '}
                            <span className='font-[600]'>{(showSelectedSkills as SelectedSkills)['roleName']}</span>
                            {' in '}
                            <span className='font-[600]'>{(showSelectedSkills as SelectedSkills)['companyName']}</span>
                            {' Company'}
                            <CusotmHr variant='thin' className='my-3' />
                        </Typography>
                        <Skills
                            selectedSkills={(showSelectedSkills as SelectedSkills)['skills']?.length > 0 ? (showSelectedSkills as SelectedSkills)['skills'] : undefined}
                        />
                    </QuickBox>

                    {/* Delete Confirmation box */}
                    {showDeleteBox && (
                        <Modal
                            isOpen={true}
                            title="Delete this experience?"
                            confirmBtnTxt="Delete"
                            onConfirm={handleRemoveExperience}
                            onCancel={() => {
                                setShowEditBox(false)
                                setShowAddBox(false)
                                setShowDeleteBox(false);
                                setFormExperienceId(undefined);
                            }}
                            onClose={() => {
                                setShowEditBox(false)
                                setShowAddBox(false)
                                setShowDeleteBox(false);
                                setFormExperienceId(undefined);
                            }}
                            confirmBtnColor="danger"
                            cancelBtnColor="light"
                        >
                            <CusotmHr className='my-2' />
                            <div className="flex flex-col justify-center w-full gap-2 mt-5 px-5">
                                <h4 className="text-xl font-bold text-gray-900">
                                    {formData.titleOfRole}
                                </h4>
                                <label className='select-none'>
                                    <input
                                        type="checkbox"
                                        checked={!!removeFromSkills}
                                        onChange={(ev) => setRemoveFromSkills(ev.target.checked)}
                                        className='ml-3 accent-red-500'
                                    />
                                    {' Remove referenced skills from my skills listing too'}
                                </label>
                            </div>
                        </Modal>
                    )}
                </ComponentWrapper>
    );
};

export default Experience;