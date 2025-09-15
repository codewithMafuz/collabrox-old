import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import QuickBox from "./QuickBox";
import { MdCancel, MdDelete, MdDone, MdOutlineCrop } from 'react-icons/md';
import { IoCloudDoneOutline } from "react-icons/io5";
import { BsCardImage } from 'react-icons/bs';
import Spinner from "../common/Spinner";
import ImageCropper from "./ImageCropper";
import { RootState } from "../../store/store";
import Progress from "../common/Progress";
import Modal from "../common/Modal";
import { useDropzone } from "react-dropzone";
import Image from "../common/Image";
import Typography from "../common/Typography";
import Input from "../common/Input";
import Button from "../common/Button";

type CropperRef = {
    handleDoneImgCropping: () => void;
};

const IMAGE_BLOB_CACHE = new Map<string, { blob: Blob, expires: number }>();

const CACHE_EXPIRY = 60 * 60 * 1000;

function cleanupExpiredImgBlobCache() {
    const now = Date.now();
    for (const [url, entry] of IMAGE_BLOB_CACHE.entries()) {
        if (entry.expires <= now) IMAGE_BLOB_CACHE.delete(url);
    }
}

function getCachedImageBlob(url: string): Blob | null {
    const entry = IMAGE_BLOB_CACHE.get(url);
    if (entry && entry.expires > Date.now()) return entry.blob;
    return null;
}

function setCachedImageBlob(url: string, blob: Blob) {
    IMAGE_BLOB_CACHE.set(url, { blob, expires: Date.now() + CACHE_EXPIRY });
}

// Run cleanup every hour
setInterval(cleanupExpiredImgBlobCache, CACHE_EXPIRY);

// Blob comparison using streaming
async function areBlobsIdentical(blob1: Blob, blob2: Blob) {
    if (blob1.size !== blob2.size) return false;

    const [buf1, buf2] = await Promise.all([blob1.arrayBuffer(), blob2.arrayBuffer()]);
    const view1 = new Uint8Array(buf1);
    const view2 = new Uint8Array(buf2);

    for (let i = 0; i < view1.length; i++) {
        if (view1[i] !== view2[i]) return false;
    }

    return true;
}

// Extracted button components to minimize re-renders
const SelectButton = React.memo(({ disabled, onChange }: {
    disabled: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => (
    <Button
        icon={<BsCardImage />}
        disabled={disabled}
        col="dark"
    >
        <label
            htmlFor="select-button-upload-image-box"
            aria-label="Select Image"
            className='flex items-center gap-2 px-3 cursor-pointer'
        >

            <span>Select</span>
            <input
                disabled={disabled}
                className='input hidden'
                onClick={ev => (ev.target as HTMLInputElement).value = ''}
                onChange={onChange}
                accept="image/*"
                type="file"
                id="select-button-upload-image-box"
            />
        </label>
    </Button>
));

const CropButton = React.memo(({ disabled, onClick }: {
    disabled: boolean;
    onClick: () => void
}) => (
    <Button
        onClick={onClick}
        disabled={disabled}
        rounded="half"
        sz="md"
        col="dark"
        icon={<MdOutlineCrop />}
    >
        Crop
    </Button>
));

const ActionButton = React.memo(({
    icon,
    text,
    onClick,
    disabled,
    loading
}: {
    icon: React.ReactNode;
    text: string;
    onClick: () => void;
    disabled: boolean;
    loading?: boolean;
}) => (
    <Button
        onClick={onClick}
        disabled={disabled}
        rounded="half"
        sz="md"
        col="dark"
        icon={icon}
        isLoading={loading}
    >
        {text}
    </Button>
));

const UploadImageBox = React.memo(({
    currentImgUrl,
    className,
    emptyImg,
    isLoading = true,
    aspectRatio = 1,
    imageUploader,
    imageDeleter,
    onClose,
    progress,
    stage
}: {
    currentImgUrl?: string;
    className: string;
    emptyImg: string;
    isLoading: boolean;
    aspectRatio?: number;
    imageUploader: (uploadableImg: File | Blob) => Promise<void>;
    imageDeleter: () => Promise<boolean>;
    onClose: () => void;
    progress?: number;
    stage?: string;
}) => {
    const username = useSelector((state: RootState) => state.user.username);
    const [currentImg, setCurrentImg] = useState<Blob | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadableImage, setUploadableImage] = useState<Blob | null>(null);
    const [onCroppingState, setOnCroppingState] = useState(false);
    const [allowSaveButton, setAllowSaveButton] = useState(false);
    const [isImgUploading, setIsImgUploading] = useState(false);
    const [isImgRemoving, setIsImgRemoving] = useState(false);
    const cropperRef = useRef<CropperRef>(null);
    const [showRemovingConfirmation, setShowRemovingConfirmation] = useState(false);
    const lastImgUrlRef = useRef<string | undefined>(undefined);

    // Memoized buttons
    const [selectBtnDisable, saveBtnDisable, cropBtnDisable, croppedDoneBtnDisable, removeBtnDisable] = useMemo(() => {
        const serverLoading = isImgUploading || isImgRemoving;
        return [
            serverLoading,
            !allowSaveButton || serverLoading || onCroppingState || (!currentImg && !uploadableImage),
            serverLoading || onCroppingState || (!uploadableImage && !currentImg),
            serverLoading,
            serverLoading || onCroppingState || (!currentImg && !uploadableImage)
        ];
    }, [isImgUploading, isImgRemoving, allowSaveButton, onCroppingState, currentImg, uploadableImage]);

    // Create dropzone handlers
    const { getRootProps, getInputProps } = useDropzone({
        accept: { 'image/*': [] },
        noClick: true,
        disabled: selectBtnDisable,
        onDragEnter: () => setIsDragging(true),
        onDragLeave: () => setIsDragging(false),
        onDrop: async (acceptedFiles) => {
            setIsDragging(false);
            if (acceptedFiles.length > 0) {
                await processFile(acceptedFiles[0]);
            }
        }
    });

    // Fetch image blob with caching
    useEffect(() => {
        if (currentImgUrl && currentImgUrl !== lastImgUrlRef.current) {
            lastImgUrlRef.current = currentImgUrl;

            (async () => {
                try {
                    const cached = getCachedImageBlob(currentImgUrl);
                    if (cached) {
                        setCurrentImg(cached);
                        setUploadableImage(cached);
                        return;
                    };

                    const response = await fetch(currentImgUrl);
                    if (!response.ok) throw new Error('Image fetch failed');

                    const blobImg = await response.blob();
                    setCurrentImg(blobImg);
                    setUploadableImage(blobImg);
                    setCachedImageBlob(currentImgUrl, blobImg);
                } catch {
                    setCurrentImg(null);
                }
            })();
        }
    }, [currentImgUrl]);

    // Memoized preview URL with cleanup
    const previewUrl = useMemo(() => {
        if (uploadableImage) return URL.createObjectURL(uploadableImage);
        if (currentImg) return URL.createObjectURL(currentImg);
        return undefined;
    }, [uploadableImage, currentImg]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleClickCloseBtnImgBox = useCallback(() => {
        onClose();
    }, [onClose]);

    const processFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) return;

        if (uploadableImage && await areBlobsIdentical(file, uploadableImage)) return;

        setUploadableImage(file);
        setOnCroppingState(true);
        setAllowSaveButton(true);
    }, [uploadableImage]);

    const handleSelectProfileImg = useCallback(async (ev: React.ChangeEvent<HTMLInputElement>) => {
        const file = ev.target.files?.[0];
        if (file) await processFile(file);
    }, [processFile]);

    const handleClickDoneCropping = useCallback(() => {
        cropperRef.current?.handleDoneImgCropping();
    }, []);

    const handleClickCancelCroppingBtn = useCallback(() => {
        setOnCroppingState(false);
    }, []);

    const handleDoneImgCropping = useCallback((img: Blob, isModified: boolean) => {
        if (isModified) {
            setUploadableImage(img);
            setAllowSaveButton(true);
        }
        setOnCroppingState(false);
    }, []);

    const handleClickCropImgBtn = useCallback(() => {
        setOnCroppingState(true);
    }, []);

    const handleClickUploadImgBtn = useCallback(async () => {
        if (!username || isLoading || isImgUploading || !uploadableImage) return;

        try {
            setIsImgUploading(true);
            await imageUploader(uploadableImage);
        } catch (er) {
            console.error("Upload error:", er);
        }
    }, [username, isLoading, isImgUploading, uploadableImage, imageUploader]);

    const handleClickRemoveImgBtn = useCallback(async () => {
        if (removeBtnDisable) return;

        if (currentImg) {
            if (uploadableImage && await areBlobsIdentical(currentImg, uploadableImage)) {
                setShowRemovingConfirmation(true);
            } else {
                setUploadableImage(currentImg);
            }
        } else {
            setUploadableImage(null);
        }
    }, [removeBtnDisable, currentImg, uploadableImage]);

    const handleConfirmDeleteImgBtn = useCallback(async () => {
        try {
            setIsImgRemoving(true);
            setUploadableImage(null);
            const success = await imageDeleter();
            if (success) handleClickCloseBtnImgBox();
        } catch (er) {
            console.error('Remove error:', er);
        } finally {
            setIsImgRemoving(false);
            setShowRemovingConfirmation(false);
        }
    }, [imageDeleter, handleClickCloseBtnImgBox]);

    useEffect(() => {
        if (progress === 0 || progress === 100) {
            setIsImgUploading(false)
        }
    }, [progress])


    return (
        <div className={"UploadImageBox " + className}>
            {/* Image delete confirmation dialogue box */}
            <Modal
                isOpen={showRemovingConfirmation}
                title="Image remove confirmation"
                cancelBtnTxt='Cancel'
                confirmBtnTxt={isImgRemoving ? 'Removing...' : 'Remove'}
                subtitle="Are you sure, you want to remove current image?"
                onCancel={() => setShowRemovingConfirmation(false)}
                onClose={() => setShowRemovingConfirmation(false)}
                onConfirm={handleConfirmDeleteImgBtn}
                parentZIndex={9999}
                confirmBtnColor="danger"
                cancelBtnColor="light"
            />

            <div className="flex justify-center flex-col items-center">
                <QuickBox allowScroll={false} topBarTitle="Preview image" onClose={handleClickCloseBtnImgBox}>
                    <div className="w-full h-full flex flex-col gap-[1%] justify-center items-center">
                        {/* Top box (buttons etc) */}
                        <div className="w-full h-[10%] flex items-center justify-around px-1">
                            <SelectButton
                                disabled={selectBtnDisable}
                                onChange={handleSelectProfileImg}
                            />

                            {!cropBtnDisable && (
                                <CropButton
                                    disabled={cropBtnDisable}
                                    onClick={handleClickCropImgBtn}
                                />
                            )}

                            {onCroppingState ? (
                                <>
                                    <ActionButton
                                        icon={<MdDone />}
                                        text="Done"
                                        onClick={handleClickDoneCropping}
                                        disabled={croppedDoneBtnDisable}
                                    />
                                    <ActionButton
                                        icon={<MdCancel />}
                                        text="Cancel"
                                        onClick={handleClickCancelCroppingBtn}
                                        disabled={false}
                                    />
                                </>
                            ) : (
                                <>
                                    <ActionButton
                                        icon={<IoCloudDoneOutline />}
                                        text={isImgUploading ? "Saving..." : "Save"}
                                        onClick={handleClickUploadImgBtn}
                                        disabled={saveBtnDisable}
                                        loading={isImgUploading}
                                    />
                                    <ActionButton
                                        icon={<MdDelete />}
                                        text={isImgRemoving ? "Removing..." : "Remove"}
                                        onClick={handleClickRemoveImgBtn}
                                        disabled={removeBtnDisable}
                                        loading={isImgRemoving}
                                    />
                                </>
                            )}
                        </div>

                        {/* body */}
                        <div
                            {...getRootProps()}
                            className={`w-[90%] h-[85%] flex items-center justify-center flex-col relative 
                         ${isDragging ? 'border-primary-base' : ''}`}>
                            <input {...getInputProps()} />
                            {/* Image */}
                            <div className="w-full h-[90%] border-dashed border border-gray-900">
                                {/* Image on croppping state */}
                                {onCroppingState ? (
                                    <div className="w-full h-full bg-white flex items-center justify-center">
                                        <ImageCropper
                                            ref={cropperRef}
                                            imgFile={uploadableImage}
                                            onCropComplete={handleDoneImgCropping}
                                            aspectRatio={aspectRatio}
                                        />
                                    </div>
                                ) : (
                                    <div className="relative w-full h-full">
                                        <Image
                                            className='object-contain object-center'
                                            width="100%"
                                            height="100%"
                                            imgSrc={previewUrl || emptyImg}
                                            alt="Uploadable"
                                            loading="lazy"
                                        />
                                        {isDragging && (
                                            <div className="absolute inset-0 bg-blue-100 bg-opacity-80 flex-center flex-col pointer-events-none">
                                                <BsCardImage className="text-4xl text-primary-base mb-2" />
                                                <Typography variant="subheading" color="primary">Drop here</Typography>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* progress animation */}
                            <div className="w-full flex flex-col items-center h-6 mb-4">
                                {isImgUploading && <Progress progress={progress || 0} stage={stage || 'Uploading'} />}
                            </div>
                        </div>
                    </div>
                </QuickBox>
            </div>
        </div>
    );
});

export default UploadImageBox;