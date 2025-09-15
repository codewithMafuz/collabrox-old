export function generateCloudinaryPath(
    userId: string,
    mediaType: 'images' | 'videos' | 'documents',
    category: string,
    subCategory: string,
    fileName: string
): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');

    const application = 'Collabrox';
    const environment = process.env.NODE_ENV || 'development';

    return `${application}/${environment}/users/${userId}/${mediaType}/${category}/${subCategory}/${yyyy}/${MM}/${dd}/${fileName}`;
}

export function extractPublicIdFromUrl(url: string): string | null {
    // Extract the public_id from Cloudinary URL
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+?)\.(?:jpg|png|avif|gif|webp)/);
    return matches ? matches[1] : null;
}