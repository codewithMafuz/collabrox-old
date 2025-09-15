import { useEffect, useRef, useState, useCallback, useMemo, memo, JSX } from "react";
import Typography from "../common/Typography";
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { MdOutlineEdit, MdOutlineLocationOn, MdOutlineMailOutline, MdRefresh } from 'react-icons/md';
import UploadImageBox from '../shared/UploadImageBox';
import profileEmpty from '../../assets/images/profile-empty.avif';
import bannerEmpty from '../../assets/images/banner-empty.avif';
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/store";
import ComponentWrapper from "../common/ComponentWrapper";
import Link from "../common/Link";
import { useSearchParams } from "react-router-dom";
import WrapperButton from "../common/WrapperButton";
import { isValidEmailAddress, isValidFullName } from "../../services/validationServices";
import { FollowButtonPersonDynamic } from "../shared/FollowButtonPerson";
import Followings from "./Followings";
import Followers from "./Followers";
import { setPersonData } from "../pages/person/personSlice";
import { getAddedSearchParamLocation, isHoverableScreen } from "../../lib/WindowUtils";
import { countChar, sanitizeEmail, sanitizeMultiSpacesIntoOne } from "../../lib/StringUtils";
import { GeneralDataProperties, PersonItem, useDeletePersonBannerImageMutation, useDeletePersonProfileImageMutation, useUpdateGeneralDataMutation } from "../../apis/personApi";
import ImageBox from "../common/ImageBox";
import useShowToast from "../../hooks/useShowToast";
import { setProfileSrcSm } from "../pages/userSlice";
import { useSSERequest } from "../../apis/useSSERequest";
import Modal from "../common/Modal";
import Input from "../common/Input";

// Utility functions
export const locationObjToStr = (location?: { city?: string; country?: string }): string => {
    if (!location) return '';
    const { city, country } = location;
    return (city && country) ? `${city}, ${country}` : city || country || '';
};

export const correctLocationStr = (str: string) => {
    let value = sanitizeMultiSpacesIntoOne(str);
    if (countChar(value, ',') >= 2) value = value.split(',').slice(0, 2).join(',');
    return value;
};

export const locationStrToObj = (str: string) => {
    if (!str) return { city: '', country: '' };
    const [city = '', country = ''] = str.split(',').map(s => s.trim());
    return { city, country };
};

// Optimized child components
const SocialIcon = memo(({
    icon,
    tooltip,
    link,
    disabled
}: {
    icon: JSX.Element;
    tooltip: string;
    link?: string;
    disabled?: boolean;
}) => (
    <Link
        rel="noreferrer"
        className="text-[.9rem] lg:text-[1rem]"
        target="_blank"
        to={link || ''}
        disabled={!link || disabled}
    >
        <WrapperButton
            tooltipConfig={{
                content: tooltip,
                className: "position-right sm:position-top",
                arrowClassName: "leftside-middle sm:bottomside-middle"
            }}
        >
            {icon}
        </WrapperButton>
    </Link>
));

const FollowCountLink = memo(({
    type,
    count,
    loggedinUsername,
    showToast
}: {
    type: 'followings' | 'followers';
    count: number;
    loggedinUsername?: string;
    showToast: ReturnType<typeof useShowToast>;
}) => (
    <Link
        sz="sm"
        col="dark"
        checkSearchToo={true}
        disabled={!loggedinUsername || count === 0}
        to={getAddedSearchParamLocation([['open', type], ['sortBy', 'popular']])}
        onDisableClick={() => {
            if (!loggedinUsername) {
                showToast(`Login required to see ${type}`);
            }
        }}
    >
        {`${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`}
    </Link>
));

const FormEditItem = ({
    id,
    label,
    value,
    onChange,
    placeholder
}: {
    id: string;
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
}) => (
    <label htmlFor={id} className="w-full">
        <Typography variant='p' color='dark' className="py-1">{label}</Typography>
        <Input
            id={id}
            name={id}
            type="text"
            value={value}
            placeholder={placeholder}
            sz='md'
            col='light'
            onChange={onChange}
        />
    </label>
);

// Main component
function PersonTopSection() {
    const dispatch = useDispatch();
    const showToast = useShowToast();
    const [searchParams] = useSearchParams();

    // followers/followings isOpen()
    const open = searchParams.get('open');
    const showFollowsBox = useMemo(() =>
        (open === 'followers' || open === 'followings') ? open : undefined,
        [open]
    );

    const divRef = useRef<HTMLDivElement | null>(null);

    // Redux state values
    const loggedinUsername = useSelector((state: RootState) => state.user.username);
    const innerWidth = useSelector((state: RootState) => state.appState.innerWidth);
    const personData = useSelector((state: RootState) => state.person);
    const {
        _id,
        name = '',
        bannerSrc,
        profileSrc,
        github = '',
        linkedin = '',
        displayEmail = '',
        bio = '',
        location = {},
        isSelfProfile,
        totalFollowings = 0,
        totalFollowers = 0,
    } = personData;

    // API hooks
    const [updateGeneralData] = useUpdateGeneralDataMutation();
    const [deletePersonBannerImage] = useDeletePersonBannerImageMutation();
    const [deletePersonProfileImage] = useDeletePersonProfileImageMutation();

    // SSE hooks
    const bannerSSE = useSSERequest({
        endpoint: "/person/image/banner/update",
        method: "PATCH",
    });

    const profileSSE = useSSERequest({
        endpoint: "/person/image/profile/update",
        method: "PATCH",
    });

    // State management
    const [editStage, setEditStage] = useState(false);
    const [showBannerBox, setShowBannerBox] = useState(false);
    const [showProfileBox, setShowProfileBox] = useState(false);
    const [showEmailTooltip] = useState(isHoverableScreen());
    const [generalDatasCopy, setGeneralDatasCopy] = useState<GeneralDataProperties>({ name });

    // Form states
    const [currentName, setCurrentName] = useState(name);
    const [currentBio, setCurrentBio] = useState(bio);
    const [currentLocationStr, setCurrentLocationStr] = useState(locationObjToStr(location));
    const [currentGithub, setCurrentGithub] = useState(github);
    const [currentLinkedin, setCurrentLinkedin] = useState(linkedin);
    const [currentDisplayEmail, setCurrentDisplayEmail] = useState(displayEmail);

    // Image size calculations
    const [bannerImgSize, setBannerImgSize] = useState({ width: 0, height: 0 });
    const [profileImgSize, setProfileImgSize] = useState(0);

    // SSE effect handlers
    useEffect(() => {
        if (bannerSSE.progress === 100 && !bannerSSE.error) {
            dispatch(setPersonData({ bannerSrc: bannerSSE.bannerSrc }));
            showToast("Banner image updated", "success");
            setShowBannerBox(false);
            bannerSSE.reset();
        } else if (bannerSSE.error) {
            showToast(bannerSSE.error);
            setShowBannerBox(false);
            bannerSSE.reset();
        }
    }, [bannerSSE]);

    useEffect(() => {
        if (profileSSE.progress === 100 && !profileSSE.error) {
            dispatch(setPersonData({
                profileSrc: profileSSE.profileSrc,
                profileSrcSm: profileSSE.profileSrcSm
            }));
            dispatch(setProfileSrcSm(profileSSE.profileSrcSm));
            showToast("Profile image updated", "success");
            setShowProfileBox(false);
            profileSSE.reset();
        } else if (profileSSE.error) {
            showToast(profileSSE.error);
            setShowProfileBox(false);
            profileSSE.reset();
        }
    }, [profileSSE]);

    // Image size calculations
    const updateImgSizes = useCallback(() => {
        if (divRef.current) {
            const width = divRef.current.clientWidth;
            const height = Math.round(width / 4);
            setBannerImgSize({ width, height });
            setProfileImgSize(
                width > 1200 ? 140 :
                    width > 800 ? 120 :
                        width > 600 ? 100 :
                            width > 500 ? 80 :
                                width > 350 ? 60 : 40
            );
        }
    }, []);

    useEffect(() => {
        updateImgSizes();
    }, [innerWidth, updateImgSizes]);

    // Handlers
    const handleClickEditGeneralData = useCallback(() => {
        setGeneralDatasCopy({
            name: currentName,
            bio: currentBio,
            location: locationStrToObj(currentLocationStr),
            github: currentGithub,
            linkedin: currentLinkedin,
            displayEmail: currentDisplayEmail
        });
        setEditStage(true);
    }, [currentName, currentBio, currentLocationStr, currentGithub, currentLinkedin, currentDisplayEmail]);

    const handleSaveGeneralData = useCallback(async () => {
        const allowedData: GeneralDataProperties = {};
        const { name, bio, location, github, linkedin, displayEmail } = generalDatasCopy;

        // Validation checks
        if (!isValidFullName(currentName)) {
            showToast('Invalid name, must be full name');
            return;
        }
        if (currentName !== name) allowedData.name = currentName;

        if (currentBio && (currentBio.length < 3 || currentBio.length > 300)) {
            showToast('Bio must be between 3-300 characters');
            return;
        }
        if (currentBio !== bio) allowedData.bio = currentBio;

        if (currentLocationStr && currentLocationStr.length > 300) {
            showToast('Location too long');
            return;
        }
        if (currentLocationStr !== locationObjToStr(location)) {
            allowedData.location = locationStrToObj(currentLocationStr);
        }

        if (currentGithub && (currentGithub.length < 3 || currentGithub.length > 200)) {
            showToast('GitHub username must be 3-200 characters');
            return;
        }
        if (currentGithub !== github) allowedData.github = currentGithub;

        if (currentLinkedin && (currentLinkedin.length < 3 || currentLinkedin.length > 200)) {
            showToast('LinkedIn username must be 3-200 characters');
            return;
        }
        if (currentLinkedin !== linkedin) allowedData.linkedin = currentLinkedin;

        if (currentDisplayEmail && !isValidEmailAddress(currentDisplayEmail)) {
            showToast('Invalid email format');
            return;
        }
        if (currentDisplayEmail !== displayEmail) allowedData.displayEmail = currentDisplayEmail;

        try {
            const response = await updateGeneralData(allowedData);
            if ('error' in response) throw new Error();

            const { status, message } = response.data!;
            if (status === "Failed") throw new Error(message);

            dispatch(setPersonData(allowedData));
            showToast(message, 'success');
            return true;
        } catch (error: any) {
            showToast(error.message || 'Failed to update');
            return false;
        }
    }, [currentName, currentBio, currentLocationStr, currentGithub, currentLinkedin, currentDisplayEmail, generalDatasCopy]);

    const handleDeleteBannerImg = useCallback(async () => {
        const { data: response } = await deletePersonBannerImage();
        const { status = 'Failed', message = 'Failed to delete banner image' } = response || {};

        if (status === 'Failed') {
            showToast(message);
            return false;
        }

        dispatch(setPersonData({ bannerSrc: undefined }));
        showToast(message, 'success');
        return true;
    }, []);

    const handleDeleteProfileImg = useCallback(async () => {
        const { data: response } = await deletePersonProfileImage();
        const { status = 'Failed', message = 'Failed to delete profile image' } = response || {};

        if (status === 'Failed') {
            showToast(message);
            return false;
        }

        dispatch(setPersonData({ profileSrc: undefined, profileSrcSm: undefined }));
        dispatch(setProfileSrcSm(undefined));
        showToast(message, 'success');
        return true;
    }, []);

    const handleChangeLocation = useCallback((ev: React.ChangeEvent<HTMLInputElement>) => {
        if (ev.target.value === ' ') return;
        setCurrentLocationStr(correctLocationStr(ev.target.value));
    }, []);

    const handleClickRefreshGeneralData = useCallback(() => {
        setCurrentName(generalDatasCopy.name!);
        setCurrentBio(generalDatasCopy.bio || '');
        setCurrentLocationStr(locationObjToStr(generalDatasCopy.location || undefined));
        setCurrentGithub(generalDatasCopy.github || '');
        setCurrentLinkedin(generalDatasCopy.linkedin || '');
        setCurrentDisplayEmail(generalDatasCopy.displayEmail || '');
    }, [generalDatasCopy]);

    const handleCloseBox = useCallback(() => {
        handleClickRefreshGeneralData();
        setEditStage(false);
    }, [handleClickRefreshGeneralData]);

    const sanitizeGitHub = useCallback((str: string) => str.toLowerCase()
        .replace(/[^a-z0-9-]+/g, '')
        .replace(/-+/g, '-')
        .replace(/^[-]+|[-]+$/g, '')
        .slice(0, 39), []);

    const sanitizeLinkedIn = useCallback((str: string) => str.toLowerCase()
        .replace(/[^a-z0-9-]+/g, '')
        .slice(0, 30), []);

    const profileStyle = useMemo(() => ({
        top: `${innerWidth > 500 ?
            bannerImgSize.height - Math.round(profileImgSize / 1.30) :
            bannerImgSize.height - Math.round(bannerImgSize.height / 2) - Math.round(profileImgSize / 2)
            }px`,
    }), [bannerImgSize, profileImgSize, innerWidth]);

    return (
        <ComponentWrapper className="w-full h-full pb-2 lg:pb-3">
            <div ref={divRef} className="personTopSection relative">
                {/* Banner and Profile Images */}
                <div className="personTopSectionImgs relative">
                    {showBannerBox && (
                        <UploadImageBox
                            currentImgUrl={bannerSrc}
                            className="flex justify-center items-center"
                            emptyImg={bannerEmpty}
                            isLoading={!_id}
                            aspectRatio={4}
                            imageUploader={async (uploadableImg) => {
                                bannerSSE.start({
                                    files: uploadableImg as File,
                                    filesFieldName: 'bannerImage',
                                });
                            }}
                            imageDeleter={handleDeleteBannerImg}
                            progress={bannerSSE.progress}
                            stage={bannerSSE.stage}
                            onClose={() => setShowBannerBox(false)}
                        />
                    )}
                    <ImageBox
                        imgSrc={bannerSrc || bannerEmpty}
                        width={`${bannerImgSize.width}px`}
                        height={`${bannerImgSize.height}px`}
                        className="rounded-sm"
                        onClick={() => setShowBannerBox(true)}
                    />

                    {showProfileBox && (
                        <UploadImageBox
                            currentImgUrl={profileSrc}
                            className="absolute flex justify-center items-center left-[30px] sm:left-[50px] md:left-[100px] lg:left-[120px]"
                            emptyImg={profileEmpty}
                            isLoading={!_id}
                            aspectRatio={1}
                            imageUploader={async (uploadableImg) => {
                                profileSSE.start({
                                    files: uploadableImg as File,
                                    filesFieldName: 'profileImage',
                                });
                            }}
                            imageDeleter={handleDeleteProfileImg}
                            progress={profileSSE.progress}
                            stage={profileSSE.stage}
                            onClose={() => setShowProfileBox(false)}
                        />
                    )}
                    <ImageBox
                        imgSrc={profileSrc || profileEmpty}
                        style={profileStyle}
                        className="rounded-full absolute flex justify-center items-center left-[30px] sm:left-[50px] md:left-[100px] lg:left-[120px]"
                        width={`${profileImgSize}px`}
                        height={`${profileImgSize}px`}
                        onClick={() => setShowProfileBox(true)}
                    />
                </div>

                {/* Content Section */}
                <div className="personTopSectionContent px-1 sm:pl-3 md:pl-3 lg:pl-4 pt-8">
                    <div className="flex items-center justify-between">
                        <Typography variant="title">{name}</Typography>
                        {loggedinUsername && isSelfProfile && (
                            <WrapperButton
                                tooltipConfig={{
                                    content: "Edit basic info",
                                    className: "position-left",
                                    arrowClassName: "rightside-middle"
                                }}
                                onClick={handleClickEditGeneralData}
                            >
                                <MdOutlineEdit />
                            </WrapperButton>
                        )}
                    </div>

                    <div className="min-h-[30px] flex items-start pl-1">
                        <Typography variant="p">{bio}</Typography>
                    </div>

                    {(location.city || location.country) && (
                        <Typography variant="small" className='pl-1'>
                            <MdOutlineLocationOn className="inline-block text-[.9rem] text-gray-500" />
                            {locationObjToStr(location)}
                        </Typography>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 sm:px-3 md:px-3 lg:px-4 pt-2">
                        <div className="flex space-x-4">
                            <FollowCountLink
                                type="followings"
                                count={totalFollowings}
                                loggedinUsername={loggedinUsername}
                                showToast={showToast}
                            />
                            <FollowCountLink
                                type="followers"
                                count={totalFollowers}
                                loggedinUsername={loggedinUsername}
                                showToast={showToast}
                            />
                            {loggedinUsername && !isSelfProfile && _id && (
                                <FollowButtonPersonDynamic personId={_id} />
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-x-4">
                            {showEmailTooltip ? (
                                <WrapperButton
                                    tooltipConfig={{
                                        content: displayEmail,
                                        parentClassName: 'max-lg:w-fit',
                                        className: "position-right sm:position-left lg:position-top",
                                        arrowClassName: "leftside-middle sm:rightside-middle lg:bottomside-middle"
                                    }}
                                >
                                    <MdOutlineMailOutline />
                                </WrapperButton>
                            ) : displayEmail && (
                                <div className="flex items-center gap-1 py-1 min-h-5">
                                    <WrapperButton>
                                        <MdOutlineMailOutline className="text-[1rem]" />
                                    </WrapperButton>
                                    <Typography variant="p">{displayEmail}</Typography>
                                </div>
                            )}

                            <div className="flex items-center gap-x-4">
                                <SocialIcon
                                    icon={<FaGithub />}
                                    tooltip="Github profile"
                                    link={github ? `https://github.com/${github}` : ''}
                                />
                                <SocialIcon
                                    icon={<FaLinkedin />}
                                    tooltip="Linkedin profile"
                                    link={linkedin ? `https://www.linkedin.com/in/${linkedin}` : ''}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {editStage && (
                <Modal
                    isOpen={true}
                    title="Edit basic info"
                    cancelBtnTxt='Cancel'
                    confirmBtnTxt="Save"
                    onCancel={handleCloseBox}
                    onClose={handleCloseBox}
                    onConfirm={async () => {
                        const success = await handleSaveGeneralData();
                        if (success) setEditStage(false);
                    }}
                    confirmBtnColor="primary"
                    cancelBtnColor="light"
                >
                    <div className="transition-all">
                        <div className="w-full flex items-center justify-end pr-1 py-2">
                            <WrapperButton
                                tooltipConfig={{
                                    content: "Reset fields to data",
                                    className: 'position-left',
                                    arrowClassName: 'rightside-middle'
                                }}
                                sz="lg"
                                onClick={handleClickRefreshGeneralData}
                                className='mr-2'
                            >
                                <MdRefresh />
                            </WrapperButton>
                        </div>

                        <form className="flex flex-col items-start justify-center sm:w-full gap-y-3">
                            <FormEditItem
                                id="currentName"
                                label="Name"
                                value={currentName}
                                onChange={(ev) => setCurrentName(sanitizeMultiSpacesIntoOne(ev.target.value))}
                                placeholder="ex - Mafuzur Rahman"
                            />
                            <FormEditItem
                                id="currentBio"
                                label="Bio"
                                value={currentBio}
                                onChange={(ev) => setCurrentBio(sanitizeMultiSpacesIntoOne(ev.target.value))}
                                placeholder="ex - Software developer | Javascript"
                            />
                            <FormEditItem
                                id="currentLocation"
                                label="Location"
                                value={currentLocationStr}
                                onChange={handleChangeLocation}
                                placeholder="ex - City, Country"
                            />
                            <FormEditItem
                                id="currentGithub"
                                label="Github"
                                value={currentGithub}
                                onChange={(ev) => setCurrentGithub(sanitizeGitHub(ev.target.value.trim()))}
                                placeholder="Github username (ex - @codewithMafuz)"
                            />
                            <FormEditItem
                                id="currentLinkedin"
                                label="Linkedin"
                                value={currentLinkedin}
                                onChange={(ev) => setCurrentLinkedin(sanitizeLinkedIn(ev.target.value.trim()))}
                                placeholder="Linkedin username (ex - mafuzur-rahman-126559215)"
                            />
                            <FormEditItem
                                id="currentDisplayEmail"
                                label="Display email"
                                value={currentDisplayEmail}
                                onChange={(ev) => setCurrentDisplayEmail(sanitizeEmail(ev.target.value.trim()))}
                                placeholder="Email"
                            />
                        </form>
                    </div>
                </Modal>
            )}

            {showFollowsBox === 'followings' && <Followings />}
            {showFollowsBox === 'followers' && <Followers />}
        </ComponentWrapper>
    );
}

export default memo(PersonTopSection);