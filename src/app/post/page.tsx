'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { UploadService } from '@/lib/uploadService';
import { FilePreview } from '@/components/ui/FilePreview';
import { ArrowLeft, Send, Loader2, Image, Video, Music } from 'lucide-react';

interface LocalFile {
    file: File;
    previewUrl: string;
    type: 'image' | 'video' | 'music';
}

export default function CreatePostPage() {
    const router = useRouter();
    const { user, profile, loading } = useAuth();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
    const [uploadProgress, setUploadProgress] = useState<{
        image?: boolean;
        video?: boolean;
        music?: boolean;
    }>({});
    const [uploadErrors, setUploadErrors] = useState<{
        image?: string;
        video?: string;
        music?: string;
    }>({});

    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);

    // Check authentication in useEffect to avoid setState during render
    useEffect(() => {
        if (!loading && (!user || !profile)) {
            router.replace('/auth');
        }
    }, [user, profile, loading, router]);

    // Cleanup preview URLs when component unmounts
    useEffect(() => {
        return () => {
            localFiles.forEach(file => {
                URL.revokeObjectURL(file.previewUrl);
            });
        };
    }, [localFiles]);

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Show loading if not authenticated (will redirect)
    if (!user || !profile) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">در حال هدایت به صفحه ورود...</p>
                </div>
            </div>
        );
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'music') => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!isValidFileType(file, type)) {
                const errorMessage = getFileTypeError(type);
                setUploadErrors(prev => ({ ...prev, [type]: errorMessage }));
                return;
            }

            // Validate file size
            if (!isValidFileSize(file, type)) {
                const errorMessage = getFileSizeError(type);
                setUploadErrors(prev => ({ ...prev, [type]: errorMessage }));
                return;
            }

            // Clear any previous errors
            setUploadErrors(prev => ({ ...prev, [type]: undefined }));

            // Create preview URL
            const previewUrl = URL.createObjectURL(file);

            // Add file to local files
            setLocalFiles(prev => [...prev, { file, previewUrl, type }]);
        }
    };

    const removeFile = (index: number) => {
        const fileToRemove = localFiles[index];
        URL.revokeObjectURL(fileToRemove.previewUrl);
        setLocalFiles(prev => prev.filter((_, i) => i !== index));
    };

    const isValidFileType = (file: File, type: 'image' | 'video' | 'music'): boolean => {
        const validTypes = {
            image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            video: ['video/mp4', 'video/quicktime', 'video/x-matroska'],
            music: ['audio/mpeg', 'audio/mp4', 'audio/m4a']
        };
        return validTypes[type].includes(file.type);
    };

    const isValidFileSize = (file: File, type: 'image' | 'video' | 'music'): boolean => {
        const maxSizes = {
            image: 10 * 1024 * 1024, // 10MB
            video: 50 * 1024 * 1024, // 50MB
            music: 10 * 1024 * 1024  // 10MB
        };
        return file.size <= maxSizes[type];
    };

    const getFileTypeError = (type: 'image' | 'video' | 'music'): string => {
        const errors = {
            image: 'فقط فایل‌های تصویری (jpg, jpeg, png, gif) پشتیبانی می‌شوند',
            video: 'فقط فایل‌های ویدیویی (mp4, mov, mkv) پشتیبانی می‌شوند',
            music: 'فقط فایل‌های صوتی (mp3, m4a) پشتیبانی می‌شوند'
        };
        return errors[type];
    };

    const getFileSizeError = (type: 'image' | 'video' | 'music'): string => {
        const errors = {
            image: 'حجم فایل تصویر باید کمتر از ۱۰ مگابایت باشد',
            video: 'حجم فایل ویدیو باید کمتر از ۵۰ مگابایت باشد',
            music: 'حجم فایل موسیقی باید کمتر از ۱۰ مگابایت باشد'
        };
        return errors[type];
    };

    const uploadFiles = async (): Promise<{ image_url?: string; video_url?: string; music_url?: string }> => {
        const uploadedFiles: { image_url?: string; video_url?: string; music_url?: string } = {};

        for (const localFile of localFiles) {
            try {
                setUploadProgress(prev => ({ ...prev, [localFile.type]: true }));

                let uploadedUrl: string;
                switch (localFile.type) {
                    case 'image':
                        uploadedUrl = await UploadService.uploadImage(localFile.file, user!.id);
                        uploadedFiles.image_url = uploadedUrl;
                        break;
                    case 'video':
                        uploadedUrl = await UploadService.uploadVideo(localFile.file, user!.id);
                        uploadedFiles.video_url = uploadedUrl;
                        break;
                    case 'music':
                        uploadedUrl = await UploadService.uploadMusic(localFile.file, user!.id);
                        uploadedFiles.music_url = uploadedUrl;
                        break;
                }
            } catch (error) {
                console.error(`خطا در آپلود ${localFile.type}:`, error);
                throw new Error(`آپلود ${localFile.type} با شکست مواجه شد`);
            } finally {
                setUploadProgress(prev => ({ ...prev, [localFile.type]: false }));
            }
        }

        return uploadedFiles;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!content.trim() || !user || !profile) return;

        setIsSubmitting(true);

        try {
            // Upload files first
            const uploadedFiles = await uploadFiles();

            // Create post with uploaded file URLs
            const { error } = await supabase
                .from('posts')
                .insert({
                    content: content.trim(),
                    user_id: user.id,
                    status: 'published',
                    image_url: uploadedFiles.image_url || null,
                    video_url: uploadedFiles.video_url || null,
                    music_url: uploadedFiles.music_url || null,
                });

            if (error) {
                console.error('Error creating post:', error);
                alert('خطا در ایجاد پست');
                return;
            }

            // Cleanup local files
            localFiles.forEach(file => {
                URL.revokeObjectURL(file.previewUrl);
            });

            // Redirect to feed after successful post
            router.push('/feed');

        } catch (error) {
            console.error('Error creating post:', error);
            alert('خطا در ایجاد پست');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
                <div className="flex items-center justify-between p-4">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>بازگشت</span>
                    </button>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">پست جدید</h1>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-2xl mx-auto p-4">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-6 p-4 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="avatar"
                            className="w-12 h-12 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-400">
                            {profile.full_name?.charAt(0) || profile.username?.charAt(0) || '👤'}
                        </div>
                    )}
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {profile.full_name || profile.username}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            @{profile.username}
                        </p>
                    </div>
                </div>

                {/* Post Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Content Textarea */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="چه چیزی در ذهنت می‌گذرد؟"
                            className="w-full h-32 resize-none border-none outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg"
                            maxLength={500}
                        />

                        {/* File Upload Section */}
                        <div className="mt-4 space-y-4">
                            {/* Upload Buttons */}
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={uploadProgress.image}
                                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 hover:border-blue-300 dark:hover:border-blue-700 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/30 dark:hover:to-indigo-900/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="relative">
                                        {uploadProgress.image ? (
                                            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                                                <Image className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                        {uploadProgress.image ? 'در حال آپلود...' : 'تصویر'}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => videoInputRef.current?.click()}
                                    disabled={uploadProgress.video}
                                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 hover:border-purple-300 dark:hover:border-purple-700 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="relative">
                                        {uploadProgress.video ? (
                                            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Video className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                        {uploadProgress.video ? 'در حال آپلود...' : 'ویدیو'}
                                    </span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => musicInputRef.current?.click()}
                                    disabled={uploadProgress.music}
                                    className="group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:border-green-300 dark:hover:border-green-700 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <div className="relative">
                                        {uploadProgress.music ? (
                                            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Music className="w-5 h-5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                        {uploadProgress.music ? 'در حال آپلود...' : 'موسیقی'}
                                    </span>
                                </button>
                            </div>

                            {/* Upload Tips */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                <p>حداکثر اندازه: تصویر ۱۰MB • ویدیو ۵۰MB • موسیقی ۱۰MB</p>
                                <p className="mt-1 text-blue-600 dark:text-blue-400">فایل‌ها فقط هنگام ارسال پست آپلود می‌شوند</p>
                            </div>

                            {/* Hidden File Inputs */}
                            <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, 'image')}
                                className="hidden"
                            />
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleFileSelect(e, 'video')}
                                className="hidden"
                            />
                            <input
                                ref={musicInputRef}
                                type="file"
                                accept="audio/*"
                                onChange={(e) => handleFileSelect(e, 'music')}
                                className="hidden"
                            />

                            {/* Upload Errors */}
                            {Object.values(uploadErrors).some(error => error) && (
                                <div className="space-y-2">
                                    {uploadErrors.image && (
                                        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                            {uploadErrors.image}
                                        </div>
                                    )}
                                    {uploadErrors.video && (
                                        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                            {uploadErrors.video}
                                        </div>
                                    )}
                                    {uploadErrors.music && (
                                        <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                                            {uploadErrors.music}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Local Files Preview */}
                            {localFiles.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        فایل‌های انتخاب شده ({localFiles.length})
                                    </h4>
                                    {localFiles.map((localFile, index) => (
                                        <FilePreview
                                            key={index}
                                            type={localFile.type}
                                            url={localFile.previewUrl}
                                            onRemove={() => removeFile(index)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {content.length}/500
                            </span>
                            <button
                                type="submit"
                                disabled={!content.trim() || isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>در حال ارسال...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        <span>ارسال</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
} 