'use client';

import { useRef } from 'react';
import { X, Image, Video, File as FileIcon, Music, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onFilesSelect: (files: File[]) => void;
}

export function FileUploadSheet({ isOpen, onClose, onFilesSelect }: FileUploadSheetProps) {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const musicInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (type: 'image' | 'video' | 'file' | 'music') => {
        const refs = {
            image: imageInputRef,
            video: videoInputRef,
            file: fileInputRef,
            music: musicInputRef,
        };
        refs[type].current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onFilesSelect(files);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

            {/* Sheet */}
            <div
                className={cn(
                    'fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl z-50 shadow-2xl',
                    'transform transition-transform duration-300',
                    isOpen ? 'translate-y-0' : 'translate-y-full'
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">انتخاب فایل</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Options */}
                <div className="grid grid-cols-4 gap-4 p-6">
                    <button
                        onClick={() => handleFileSelect('image')}
                        className="flex flex-col items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl transition"
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <Image className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">تصویر</span>
                    </button>

                    <button
                        onClick={() => handleFileSelect('video')}
                        className="flex flex-col items-center gap-2 p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-2xl transition"
                    >
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                            <Video className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">ویدیو</span>
                    </button>

                    <button
                        onClick={() => handleFileSelect('music')}
                        className="flex flex-col items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-2xl transition"
                    >
                        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">صوت</span>
                    </button>

                    <button
                        onClick={() => handleFileSelect('file')}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-2xl transition"
                    >
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                            <FileIcon className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">فایل</span>
                    </button>
                </div>

                {/* Hidden Inputs */}
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                />
                <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <input
                    ref={musicInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                />
            </div>
        </>
    );
}





