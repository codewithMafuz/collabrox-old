// Resize image utility
type ResizedImage = {
    imageFile: File;
    imgSrc: string;
};

const resizeImageFile = async (
    file: File,
    maxWidth: number,
    maxHeight: number,
    imageQuality: number = 1.0
): Promise<ResizedImage> => {
    return new Promise<ResizedImage>((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);

        img.onload = () => {
            const aspectRatio = img.width / img.height;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                width = maxWidth;
                height = Math.round(width / aspectRatio);
            }
            if (height > maxHeight) {
                height = maxHeight;
                width = Math.round(height * aspectRatio);
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
            }

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const resizedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now(),
                        });
                        const imgSrc = canvas.toDataURL(file.type, imageQuality);
                        resolve({ imageFile: resizedFile, imgSrc });
                    } else {
                        reject(new Error("Failed to resize image."));
                    }
                },
                file.type,
                imageQuality
            );
        };

        img.onerror = () => reject(new Error("Failed to load image."));
    });
};


export {
    resizeImageFile,
}