import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';

// env vars checks
if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Cloudinary configuration is missing');
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export type FolderPath = `/${string}`;

export type UploadImageResponse = {
    status: 'OK' | 'Failed';
    msg: string;
    srcURL?: string;
    publicId?: string;
};

/**
 * Uploads a file buffer to Cloudinary.
 * @param buffer - The file buffer to upload.
 * @param public_id - The desired public_id for the asset in Cloudinary. This will be the unique identifier.
 * @param overwrite - Whether to overwrite the asset if a file with the same public_id already exists.
 * @returns An object containing the upload status, a message, and the secure URL of the uploaded file.
 */
export const uploadToCloudinary = (
    buffer: Buffer,
    public_id: string,
    overwrite: boolean = true
): Promise<UploadImageResponse> => {
    return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                public_id,
                overwrite,
                resource_type: 'image',
                format: 'avif' // Store as AVIF for optimization
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return resolve({
                        status: 'Failed',
                        msg: error.message || 'Upload failed'
                    });
                }
                if (result) {
                    return resolve({
                        status: 'OK',
                        msg: 'Upload successful',
                        srcURL: result.secure_url,
                        publicId: result.public_id,
                    });
                }
                return resolve({
                    status: 'Failed',
                    msg: 'Unknown upload error'
                });
            }
        );

        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

// --- NEW SPECIALIZED FUNCTION FOR PROFILE IMAGES ---
export interface ProfileUploadResponse {
    status: 'OK' | 'Failed';
    msg: string;
    profileSrc?: string;
    profileSrcSm?: string;
}

/**
 * Uploads a profile image and eagerly creates a small thumbnail version.
 * Both versions are converted to AVIF format for optimization.
 * @param buffer The original image buffer.
 * @param public_id The base public_id for the asset in Cloudinary.
 * @returns An object containing the status and the URLs for both the full-size and small images.
 */
export const uploadProfileImageWithThumb = (
    buffer: Buffer,
    public_id: string
): Promise<ProfileUploadResponse> => {
    return new Promise((resolve) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                public_id,
                overwrite: false, // Don't overwrite, we're using unique filenames
                resource_type: 'image',
                format: 'avif',
                eager: [
                    {
                        width: 80,
                        height: 80,
                        crop: 'fill',
                        gravity: 'face',
                        format: 'avif'
                    }
                ]
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error) {
                    console.error('Cloudinary upload error:', error);
                    return resolve({ status: 'Failed', msg: error.message || 'Upload failed' });
                }

                if (result && result.eager && result.eager.length > 0) {
                    resolve({
                        status: 'OK',
                        msg: 'Upload successful',
                        profileSrc: result.secure_url,
                        profileSrcSm: result.eager[0].secure_url,
                    });
                } else {
                    resolve({ status: 'Failed', msg: 'Upload succeeded but transformation failed.' });
                }
            }
        );

        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);
        readableStream.pipe(uploadStream);
    });
};

/**
 * Deletes all files in a specified folder in Cloudinary Storage,
 * except those explicitly listed in the `except` array.
 * @param folderPath - The folder path (prefix) in Cloudinary (e.g., `/${userId}/person/banner`).
 * @param except - List of public_ids to skip from deletion.
 * @returns - A promise that resolves when the operation is complete.
 */
export async function deleteAllInFolder(
    folderPath: FolderPath,
    except: string[] = []
): Promise<{ status: 'OK' | 'Failed'; msg?: string }> {
    try {
        // Remove leading slash for Cloudinary prefix
        const prefix = folderPath.startsWith('/') ? folderPath.substring(1) : folderPath;

        if (!prefix) {
            return { status: 'Failed', msg: 'Invalid folder path provided.' };
        }

        // Fetch all resources in the folder
        const resourcesResult = await cloudinary.api.resources({
            type: 'upload',
            prefix,
            max_results: 500
        });

        const resources = resourcesResult.resources ?? [];

        // Filter out excepted public_ids
        const toDelete = resources
            .map((res: any) => res.public_id)
            .filter((id: string) => !except.includes(id));

        if (toDelete.length > 0) {
            await cloudinary.api.delete_resources(toDelete);
        }

        // Try deleting folder only if no resources remain
        const remaining = resources.length - toDelete.length;
        if (remaining === 0) {
            await cloudinary.api.delete_folder(prefix);
        }

        return { status: 'OK' };
    } catch (err) {
        console.error(`Error in deleteAllInFolder ${folderPath}:`, err);
        const error = err as { error?: { message: string } };
        return { status: 'Failed', msg: error.error?.message ?? 'Failed to delete folder contents' };
    }
}

/**
 * Deletes a specific resource from Cloudinary by its public_id
 * @param publicId - The public_id of the resource to delete
 * @returns - A promise that resolves when the operation is complete.
 */
export async function deleteFromCloudinary(publicId: string): Promise<{ status: 'OK' | 'Failed'; msg?: string }> {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            return { status: 'OK' };
        } else {
            return { status: 'Failed', msg: result.result };
        }
    } catch (err) {
        console.error(`Error deleting resource ${publicId}:`, err);
        const error = err as { error?: { message: string } };
        return { status: 'Failed', msg: error.error?.message ?? 'Failed to delete resource' };
    }
}


export {
    cloudinary
};