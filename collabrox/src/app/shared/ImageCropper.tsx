import React, {
    useRef,
    useState,
    useEffect,
    useImperativeHandle,
    forwardRef,
    useCallback,
    useMemo
} from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.min.css';

type ImageCropperProps = {
    imgFile: Blob | File | null;
    onCropComplete: (cropped: File, isModified: boolean) => void;
    aspectRatio?: number;
};

async function dataURLtoFile(dataUrl: string): Promise<File> {
    const blob = await (await fetch(dataUrl)).blob();
    return new File(
        [blob],
        `cropped-${Math.random().toString(36).slice(2)}.webp`,
        { type: 'image/webp' }
    );
}

const ImageCropper = forwardRef(({ imgFile, onCropComplete, aspectRatio = 1 }: ImageCropperProps, ref) => {
    const cropperRef = useRef<Cropper | any>(null);
    const [image, setImage] = useState<string | null>(null);
    const [initialCropData, setInitialCropData] = useState<any>(null);

    const handleZoom = useCallback((ev: any) => {
        const cropper = cropperRef?.current?.cropper;
        if (cropper) {
            const maxZoom = 1.8;
            const zoomRatio = ev.detail.ratio;
            if (zoomRatio > maxZoom) {
                cropper.zoomTo(maxZoom);
                ev.preventDefault();
            }
        }
    }, []);

    useEffect(() => {
        let reader: FileReader | null = new FileReader();
        if (imgFile) {
            reader.onload = () => setImage(reader?.result as string);
            reader.readAsDataURL(imgFile);
        }

        return () => {
            reader = null;
            setImage(null);
            setInitialCropData(null);
        };
    }, [imgFile]);

    const handleCropperReady = useCallback(() => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper) return;
        const data = cropper.getData(true);
        const zoom = cropper.getImageData()?.scaleX ?? 1;
        setInitialCropData({ ...data, zoom });
    }, []);

    useImperativeHandle(ref, () => ({
        handleDoneImgCropping,
    }));

    const isCropChanged = (currentData: any, zoom: number) => {
        if (!initialCropData) return true;

        const keysToCompare = ['x', 'y', 'width', 'height'];
        for (let key of keysToCompare) {
            if (Math.abs(currentData[key] - initialCropData[key]) > 1) {
                return true;
            }
        }

        if (Math.abs(zoom - initialCropData.zoom) > 0.01) {
            return true;
        }

        return false;
    };

    const handleDoneImgCropping = useCallback(async () => {
        const cropper = cropperRef.current?.cropper;
        if (!cropper || !imgFile) return;

        const canvas = cropper.getCroppedCanvas();
        const imgSrc = canvas.toDataURL('image/webp');
        const croppedFile = await dataURLtoFile(imgSrc);

        const currentData = cropper.getData(true);
        const zoom = cropper.getImageData()?.scaleX ?? 1;

        const isModified = isCropChanged(currentData, zoom);
        console.log({isModified})

        onCropComplete(croppedFile, isModified);
    }, [onCropComplete, imgFile, initialCropData]);

    const cropperOptions = useMemo(() => ({
        style: { height: '100%', width: '100%' },
        aspectRatio,
        guides: false,
        viewMode: 1 as const,
        dragMode: 'move' as const,
        cropBoxResizable: false,
        cropBoxMovable: false,
        background: false,
        autoCropArea: 1,
        zoom: handleZoom
    }), [aspectRatio]);

    return (
        <div className="flex flex-col items-center p-4 w-full h-full">
            {image && (
                <div className="cropperBox flex flex-col items-center w-full h-full">
                    <Cropper
                        ref={cropperRef}
                        src={image}
                        ready={handleCropperReady}
                        {...cropperOptions}
                    />
                </div>
            )}
        </div>
    );
});

export default React.memo(ImageCropper);