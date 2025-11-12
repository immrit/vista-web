import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
    try {
        console.log('=== SEND DELETE CODE API ===')
        const { userId, userEmail } = await request.json()

        if (!userId || !userEmail) {
            return NextResponse.json(
                { error: 'User ID and email are required' },
                { status: 400 }
            )
        }

        const cookieStore = await cookies()
        console.log('Cookies found:', cookieStore.getAll().length)

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use anon key for API operations
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        // For now, we'll trust the client-side user data
        // In production, you should implement proper server-side authentication
        console.log('Using client-provided user data:', { userId, userEmail })

        // Generate a 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
        console.log('Generated code:', verificationCode)

        // Store the code in the delete_codes table
        const { error: codeError } = await supabase
            .from('delete_codes')
            .upsert({
                user_id: userId,
                code: verificationCode,
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
                created_at: new Date().toISOString()
            })

        if (codeError) {
            console.error('Error storing verification code:', codeError)
            return NextResponse.json(
                { error: 'Failed to store verification code', details: codeError.message },
                { status: 500 }
            )
        }

        console.log('Code stored successfully')

        // Configure nodemailer transporter
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'mail.chabokan.net',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'info@coffevista.ir',
                pass: process.env.SMTP_PASS || 'di3m0yfYfusW',
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        // Get user profile for name and language preference
        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, username')
            .eq('id', userId)
            .single()

        if (profileError) {
            console.error('Error fetching user profile:', profileError)
            // Continue with default values if profile fetch fails
        }

        // Determine language (default to Persian)
        // Note: language column doesn't exist in profiles table, defaulting to 'fa'
        const userLanguage = 'fa'
        const isRTL = true // Always RTL for Persian
        const isEnglish = false

        // Get user's display name
        const displayName = userProfile?.full_name || userProfile?.username || userEmail.split('@')[0]

        // Language-specific content
        const content = {
            fa: {
                subject: 'کد تأیید حذف حساب کاربری - ویستا',
                greeting: `سلام ${displayName} عزیز،`,
                mainText: 'درخواست حذف حساب کاربری شما در <strong>ویستا</strong> دریافت شده است. برای اطمینان از اینکه این درخواست توسط شما انجام شده، لطفاً کد تأیید زیر را در صفحه تنظیمات وارد کنید.',
                codeLabel: 'کد تأیید 6 رقمی',
                timerText: 'این کد تا 10 دقیقه معتبر است',
                warningTitle: '⚠️ هشدار مهم',
                warningText: 'حذف حساب کاربری عملی <strong>غیرقابل بازگشت</strong> است. با تأیید این کد، تمام اطلاعات شما شامل:<br>• پست‌ها و محتوا<br>• نظرات و لایک‌ها<br>• فایل‌ها و تصاویر<br>• تنظیمات پروفایل<br><strong>برای همیشه حذف خواهد شد.</strong>',
                infoTitle: 'ℹ️ اطلاعات امنیتی',
                infoText: 'اگر شما درخواست حذف حساب کاربری نداده‌اید، می‌توانید این ایمیل را نادیده بگیرید. حساب کاربری شما در امان خواهد بود و هیچ تغییری اعمال نخواهد شد.',
                signature: 'با احترام،<br><strong>تیم پشتیبانی ویستا</strong>',
                footerTitle: 'ویستا',
                footerSubtitle: 'پلتفرم اشتراک‌گذاری محتوا و تعامل اجتماعی',
                supportTitle: 'پشتیبانی',
                supportText: 'این ایمیل به صورت خودکار ارسال شده است.<br>لطفاً به آن پاسخ ندهید.',
                website: 'وب‌سایت',
                support: 'پشتیبانی',
                privacy: 'حریم خصوصی'
            },
            en: {
                subject: 'Account Deletion Verification Code - Vista',
                greeting: `Hello ${displayName},`,
                mainText: 'Your account deletion request has been received in <strong>Vista</strong>. To confirm that this request was made by you, please enter the verification code below in the settings page.',
                codeLabel: '6-Digit Verification Code',
                timerText: 'This code is valid for 10 minutes',
                warningTitle: '⚠️ Important Warning',
                warningText: 'Account deletion is an <strong>irreversible</strong> action. By confirming this code, all your information including:<br>• Posts and content<br>• Comments and likes<br>• Files and images<br>• Profile settings<br><strong>will be permanently deleted.</strong>',
                infoTitle: 'ℹ️ Security Information',
                infoText: 'If you did not request account deletion, you can ignore this email. Your account will remain safe and no changes will be made.',
                signature: 'Best regards,<br><strong>Vista Support Team</strong>',
                footerTitle: 'Vista',
                footerSubtitle: 'Content sharing and social interaction platform',
                supportTitle: 'Support',
                supportText: 'This email was sent automatically.<br>Please do not reply to it.',
                website: 'Website',
                support: 'Support',
                privacy: 'Privacy'
            }
        }

        const lang = content[userLanguage as keyof typeof content] || content.fa

        // Email content
        const mailOptions = {
            from: process.env.SMTP_FROM || '"Vista" <info@coffevista.ir>',
            to: userEmail,
            subject: lang.subject,
            html: `
                <!DOCTYPE html>
                <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${userLanguage}">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${lang.subject}</title>
                    <style>
                        * {
                            margin: 0;
                            padding: 0;
                            box-sizing: border-box;
                        }
                        
                        body {
                            font-family: ${isRTL ? "'Tahoma', 'Arial', 'Segoe UI', sans-serif" : "'Segoe UI', 'Arial', sans-serif"};
                            line-height: 1.6;
                            color: #333;
                            direction: ${isRTL ? 'rtl' : 'ltr'};
                            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                            padding: 20px 0;
                        }
                        
                        .email-container {
                            max-width: 600px;
                            margin: 0 auto;
                            background: #ffffff;
                            border-radius: 16px;
                            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                            overflow: hidden;
                            border: 1px solid #e1e5e9;
                        }
                        
                        .header {
                            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                            color: white;
                            padding: 40px 30px;
                            text-align: center;
                            position: relative;
                        }
                        
                        .header::before {
                            content: '';
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            bottom: 0;
                            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.1)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                            opacity: 0.3;
                        }
                        
                        .logo {
                            font-size: 32px;
                            font-weight: 700;
                            margin-bottom: 15px;
                            position: relative;
                            z-index: 1;
                        }
                        
                        .logo-icon {
                            display: inline-block;
                            width: 40px;
                            height: 40px;
                            background: rgba(255,255,255,0.2);
                            border-radius: 50%;
                            margin-${isRTL ? 'left' : 'right'}: 10px;
                            vertical-align: middle;
                            position: relative;
                        }
                        
                        .logo-icon::before {
                            content: '👁️';
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            font-size: 20px;
                        }
                        
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                            font-weight: 600;
                            position: relative;
                            z-index: 1;
                        }
                        
                        .header-subtitle {
                            font-size: 16px;
                            opacity: 0.9;
                            margin-top: 8px;
                            position: relative;
                            z-index: 1;
                        }
                        
                        .content {
                            padding: 40px 30px;
                            background: #ffffff;
                        }
                        
                        .greeting {
                            font-size: 18px;
                            color: #2c3e50;
                            margin-bottom: 25px;
                            font-weight: 500;
                        }
                        
                        .main-text {
                            font-size: 16px;
                            color: #555;
                            margin-bottom: 30px;
                            line-height: 1.7;
                        }
                        
                        .code-section {
                            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                            border: 2px solid #dee2e6;
                            border-radius: 12px;
                            padding: 30px;
                            text-align: center;
                            margin: 30px 0;
                            position: relative;
                        }
                        
                        .code-section::before {
                            content: '';
                            position: absolute;
                            top: -2px;
                            left: -2px;
                            right: -2px;
                            bottom: -2px;
                            background: linear-gradient(45deg, #6c757d, #495057);
                            border-radius: 12px;
                            z-index: -1;
                        }
                        
                        .code-label {
                            font-size: 14px;
                            color: #6c757d;
                            margin-bottom: 15px;
                            font-weight: 500;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                        }
                        
                        .verification-code {
                            font-size: 42px;
                            font-weight: 700;
                            color: #2c3e50;
                            letter-spacing: 12px;
                            font-family: 'Courier New', 'Monaco', monospace;
                            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            background: linear-gradient(135deg, #2c3e50, #34495e);
                            -webkit-background-clip: text;
                            -webkit-text-fill-color: transparent;
                            background-clip: text;
                        }
                        
                        .timer-section {
                            background: #e3f2fd;
                            border: 1px solid #bbdefb;
                            border-radius: 8px;
                            padding: 15px;
                            margin: 20px 0;
                            text-align: center;
                        }
                        
                        .timer-icon {
                            font-size: 18px;
                            margin-${isRTL ? 'left' : 'right'}: 8px;
                        }
                        
                        .timer-text {
                            font-size: 14px;
                            color: #1976d2;
                            font-weight: 500;
                        }
                        
                        .warning-section {
                            background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
                            border: 1px solid #ffcc02;
                            border-radius: 12px;
                            padding: 25px;
                            margin: 25px 0;
                            position: relative;
                        }
                        
                        .warning-section::before {
                            content: '⚠️';
                            position: absolute;
                            top: -10px;
                            ${isRTL ? 'right' : 'left'}: 20px;
                            background: #fff;
                            padding: 5px 10px;
                            border-radius: 20px;
                            font-size: 16px;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        }
                        
                        .warning-title {
                            color: #e65100;
                            font-size: 18px;
                            font-weight: 600;
                            margin-bottom: 10px;
                        }
                        
                        .warning-text {
                            color: #bf360c;
                            font-size: 14px;
                            line-height: 1.6;
                        }
                        
                        .info-section {
                            background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
                            border: 1px solid #4caf50;
                            border-radius: 12px;
                            padding: 25px;
                            margin: 25px 0;
                        }
                        
                        .info-title {
                            color: #2e7d32;
                            font-size: 18px;
                            font-weight: 600;
                            margin-bottom: 10px;
                        }
                        
                        .info-text {
                            color: #388e3c;
                            font-size: 14px;
                            line-height: 1.6;
                        }
                        
                        .signature {
                            margin-top: 35px;
                            padding-top: 25px;
                            border-top: 2px solid #f1f3f4;
                            text-align: center;
                        }
                        
                        .signature-text {
                            font-size: 16px;
                            color: #2c3e50;
                            font-weight: 500;
                        }
                        
                        .footer {
                            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                        }
                        
                        .footer-content {
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            flex-wrap: wrap;
                            gap: 20px;
                        }
                        
                        .footer-left, .footer-right {
                            flex: 1;
                            min-width: 200px;
                        }
                        
                        .footer-title {
                            font-size: 16px;
                            font-weight: 600;
                            margin-bottom: 10px;
                        }
                        
                        .footer-text {
                            font-size: 12px;
                            opacity: 0.8;
                            line-height: 1.5;
                        }
                        
                        .footer-divider {
                            width: 1px;
                            height: 60px;
                            background: rgba(255,255,255,0.2);
                        }
                        
                        .social-links {
                            margin-top: 20px;
                        }
                        
                        .social-link {
                            display: inline-block;
                            margin: 0 10px;
                            color: white;
                            text-decoration: none;
                            font-size: 14px;
                            opacity: 0.8;
                            transition: opacity 0.3s;
                        }
                        
                        .social-link:hover {
                            opacity: 1;
                        }
                        
                        @media (max-width: 600px) {
                            .email-container {
                                margin: 10px;
                                border-radius: 12px;
                            }
                            
                            .header, .content, .footer {
                                padding: 25px 20px;
                            }
                            
                            .verification-code {
                                font-size: 32px;
                                letter-spacing: 8px;
                            }
                            
                            .footer-content {
                                flex-direction: column;
                                text-align: center;
                            }
                            
                            .footer-divider {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="email-container">
                        <div class="header">
                            <div class="logo">
                                <span class="logo-icon"></span>
                                ${isRTL ? 'ویستا' : 'Vista'}
                            </div>
                            <h1>${isRTL ? 'کد تأیید حذف حساب کاربری' : 'Account Deletion Verification'}</h1>
                            <div class="header-subtitle">${isRTL ? 'مرحله نهایی تأیید هویت' : 'Final Identity Verification Step'}</div>
                        </div>
                        
                        <div class="content">
                            <div class="greeting">${lang.greeting}</div>
                            
                            <div class="main-text">${lang.mainText}</div>
                            
                            <div class="code-section">
                                <div class="code-label">${lang.codeLabel}</div>
                                <div class="verification-code">${verificationCode}</div>
                            </div>
                            
                            <div class="timer-section">
                                <span class="timer-icon">⏰</span>
                                <span class="timer-text">${lang.timerText}</span>
                            </div>
                            
                            <div class="warning-section">
                                <div class="warning-title">${lang.warningTitle}</div>
                                <div class="warning-text">${lang.warningText}</div>
                            </div>
                            
                            <div class="info-section">
                                <div class="info-title">${lang.infoTitle}</div>
                                <div class="info-text">${lang.infoText}</div>
                            </div>
                            
                            <div class="signature">
                                <div class="signature-text">${lang.signature}</div>
                            </div>
                        </div>
                        
                        <div class="footer">
                            <div class="footer-content">
                                <div class="footer-left">
                                    <div class="footer-title">${lang.footerTitle}</div>
                                    <div class="footer-text">${lang.footerSubtitle}</div>
                                </div>
                                
                                <div class="footer-divider"></div>
                                
                                <div class="footer-right">
                                    <div class="footer-title">${lang.supportTitle}</div>
                                    <div class="footer-text">${lang.supportText}</div>
                                </div>
                            </div>
                            
                            <div class="social-links">
                                <a href="#" class="social-link">${lang.website}</a>
                                <a href="#" class="social-link">${lang.support}</a>
                                <a href="#" class="social-link">${lang.privacy}</a>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `
        }

        // Send email
        console.log('Sending email to:', userEmail)
        try {
            const info = await transporter.sendMail(mailOptions)
            console.log('Email sent successfully:', info.messageId)
            console.log('Email response:', info.response)
        } catch (emailError) {
            console.error('Error sending email:', emailError)
            // Still return success for code generation, but log the email error
            // The code is already stored, so the user can still use it
            return NextResponse.json(
                {
                    message: 'Verification code generated successfully, but email sending failed',
                    error: 'Email delivery failed',
                    details: emailError instanceof Error ? emailError.message : String(emailError),
                    email: userEmail,
                    expiresIn: '10 minutes'
                },
                { status: 500 }
            )
        }

        return NextResponse.json(
            {
                message: 'Verification code sent successfully',
                email: userEmail,
                expiresIn: '10 minutes'
            },
            { status: 200 }
        )

    } catch (error) {
        console.error('Error generating verification code:', error)
        return NextResponse.json(
            { error: 'Failed to generate verification code', details: error },
            { status: 500 }
        )
    }
} 