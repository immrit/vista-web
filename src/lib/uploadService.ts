import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Arvan Cloud Storage Configuration
const s3Client = new S3Client({
    region: 'ir-thr-at1',
    credentials: {
        accessKeyId: '4f4716fb-fa84-4ae7-9c8b-34d2a0896cdf',
        secretAccessKey: 'a6b4db27b4c54bfa46cbc4fd8a4ba2079e2da0cd2800acdc80dd758f8b2c1ec5',
    },
    endpoint: 'https://coffevista.s3.ir-thr-at1.arvanstorage.ir',
    forcePathStyle: true,
});

const BUCKET_NAME = 'coffevista';
const CDN_BASE_URL = 'https://storage.389346.ir.cdn.ir';

export class UploadService {
    // Upload image file
    static async uploadImage(file: File, userId: string): Promise<string> {
        try {
            // Validate file type
            if (!this.isValidImageFormat(file.type)) {
                throw new Error('فقط فایل‌های تصویری (jpg, jpeg, png, gif) پشتیبانی می‌شوند');
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('حجم فایل تصویر باید کمتر از ۱۰ مگابایت باشد');
            }

            // Generate unique filename
            const timestamp = Date.now();
            const extension = file.name.split('.').pop();
            const fileName = `posts/${userId}_${timestamp}.${extension}`;

            // Convert File to ArrayBuffer for AWS S3
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Upload to Arvan Cloud
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: uint8Array,
                ContentType: file.type,
                ACL: 'public-read',
            }));

            const uploadedUrl = `${CDN_BASE_URL}/${BUCKET_NAME}/${fileName}`;
            console.log('تصویر با موفقیت آپلود شد:', uploadedUrl);

            return uploadedUrl;
        } catch (error) {
            console.error('خطا در آپلود تصویر:', error);
            throw new Error('آپلود تصویر با شکست مواجه شد');
        }
    }

    // Upload video file
    static async uploadVideo(file: File, userId: string): Promise<string> {
        try {
            // Validate file type
            if (!this.isValidVideoFormat(file.type)) {
                throw new Error('فقط فایل‌های ویدیویی (mp4, mov, mkv) پشتیبانی می‌شوند');
            }

            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                throw new Error('حجم فایل ویدیو باید کمتر از ۵۰ مگابایت باشد');
            }

            // Generate unique filename
            const timestamp = Date.now();
            const extension = file.name.split('.').pop();
            const fileName = `videos/${userId}_${timestamp}.${extension}`;

            // Convert File to ArrayBuffer for AWS S3
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Upload to Arvan Cloud
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: uint8Array,
                ContentType: file.type,
                ACL: 'public-read',
            }));

            const uploadedUrl = `${CDN_BASE_URL}/${BUCKET_NAME}/${fileName}`;
            console.log('ویدیو با موفقیت آپلود شد:', uploadedUrl);

            return uploadedUrl;
        } catch (error) {
            console.error('خطا در آپلود ویدیو:', error);
            throw new Error('آپلود ویدیو با شکست مواجه شد');
        }
    }

    // Upload music file
    static async uploadMusic(file: File, userId: string): Promise<string> {
        try {
            // Validate file type
            if (!this.isValidAudioFormat(file.type)) {
                throw new Error('فقط فایل‌های صوتی (mp3, m4a) پشتیبانی می‌شوند');
            }

            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('حجم فایل موسیقی باید کمتر از ۱۰ مگابایت باشد');
            }

            // Generate unique filename
            const timestamp = Date.now();
            const extension = file.name.split('.').pop();
            const fileName = `music/${userId}_${timestamp}.${extension}`;

            // Convert File to ArrayBuffer for AWS S3
            const arrayBuffer = await file.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            // Upload to Arvan Cloud
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: uint8Array,
                ContentType: file.type,
                ACL: 'public-read',
            }));

            const uploadedUrl = `${CDN_BASE_URL}/${BUCKET_NAME}/${fileName}`;
            console.log('موسیقی با موفقیت آپلود شد:', uploadedUrl);

            return uploadedUrl;
        } catch (error) {
            console.error('خطا در آپلود موسیقی:', error);
            throw new Error('آپلود موسیقی با شکست مواجه شد');
        }
    }

    // Delete file from storage
    static async deleteFile(fileUrl: string): Promise<boolean> {
        try {
            const url = new URL(fileUrl);
            const key = url.pathname.split('/').slice(2).join('/'); // Remove /bucket-name/ from path

            await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            }));

            console.log('فایل با موفقیت حذف شد:', fileUrl);
            return true;
        } catch (error) {
            console.error('خطا در حذف فایل:', error);
            return false;
        }
    }

    // Validation helpers
    private static isValidImageFormat(mimeType: string): boolean {
        return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType);
    }

    private static isValidVideoFormat(mimeType: string): boolean {
        return ['video/mp4', 'video/quicktime', 'video/x-matroska'].includes(mimeType);
    }

    private static isValidAudioFormat(mimeType: string): boolean {
        return ['audio/mpeg', 'audio/mp4', 'audio/m4a'].includes(mimeType);
    }

    // Get file extension from mime type
    static getFileExtension(mimeType: string): string {
        const extensions: { [key: string]: string } = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'video/mp4': 'mp4',
            'video/quicktime': 'mov',
            'video/x-matroska': 'mkv',
            'audio/mpeg': 'mp3',
            'audio/mp4': 'm4a',
            'audio/m4a': 'm4a',
        };
        return extensions[mimeType] || 'bin';
    }
} 