import { z } from 'zod';

export const usernameSchema = z
  .string()
  .min(3, 'نام کاربری باید حداقل ۳ کاراکتر باشد')
  .max(30, 'نام کاربری نمی‌تواند بیشتر از ۳۰ کاراکتر باشد')
  .regex(/^[a-zA-Z0-9_]+$/, 'نام کاربری فقط می‌تواند شامل حروف، اعداد و _ باشد')
  .transform(str => str.toLowerCase().trim());

export const emailSchema = z
  .string()
  .email('ایمیل معتبر وارد کنید')
  .transform(str => str.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'رمز عبور باید شامل حروف بزرگ، کوچک و عدد باشد');

export const postContentSchema = z
  .string()
  .min(1, 'محتوا نمی‌تواند خالی باشد')
  .max(5000, 'محتوا نمی‌تواند بیشتر از ۵۰۰۰ کاراکتر باشد')
  .transform(str => str.trim());

export const PostSchema = z.object({
  content: postContentSchema,
  images: z.array(z.string().url('آدرس تصویر معتبر نیست')).max(10, 'حداکثر ۱۰ تصویر مجاز است').optional(),
  mentions: z.array(usernameSchema).max(20, 'حداکثر ۲۰ منشن مجاز است').optional(),
  hashtags: z.array(z.string().max(50)).max(30, 'حداکثر ۳۰ هشتگ مجاز است').optional(),
});

export const MessageSchema = z.object({
  conversationId: z.string().uuid('شناسه گفتگو معتبر نیست'),
  content: z
    .string()
    .min(1, 'پیام نمی‌تواند خالی باشد')
    .max(2000, 'پیام نمی‌تواند بیشتر از ۲۰۰۰ کاراکتر باشد')
    .transform(str => str.trim()),
  attachmentUrl: z.string().url().optional(),
  attachmentType: z.enum(['image', 'video', 'audio', 'file']).optional(),
  replyToId: z.string().uuid().optional(),
});

export const ProfileUpdateSchema = z.object({
  fullName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد').max(100, 'نام نمی‌تواند بیشتر از ۱۰۰ کاراکتر باشد').optional(),
  bio: z.string().max(500, 'بیو نمی‌تواند بیشتر از ۵۰۰ کاراکتر باشد').optional(),
  avatarUrl: z.string().url('آدرس تصویر معتبر نیست').optional(),
  website: z.string().url('آدرس وبسایت معتبر نیست').optional(),
});

export type PostInput = z.infer<typeof PostSchema>;
export type MessageInput = z.infer<typeof MessageSchema>;
export type ProfileUpdateInput = z.infer<typeof ProfileUpdateSchema>;








