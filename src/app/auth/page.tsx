"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { MultiStepSignUp } from "@/components/ui/MultiStepSignUp";
import { useAuth } from "@/hooks/useAuth";

// Auth mode type
type AuthMode = "login" | "register";

type Lang = 'fa' | 'en';

const texts = {
    fa: {
        login: "ورود",
        register: "ثبت‌نام",
        welcome: "خوش برگشتی! ورود سریع و امن.",
        join: "حساب جدید بساز و به جمع ما بپیوند!",
        email: "ایمیل",
        password: "رمز عبور",
        placeholderEmail: "example@gmail.com",
        placeholderPassword: "رمز عبور",
        noAccount: "حساب نداری؟",
        haveAccount: "حساب داری؟",
        switchToRegister: "ثبت‌نام",
        switchToLogin: "ورود",
        terms: "شرایط استفاده",
        privacy: "حریم خصوصی",
        agree: "با ورود یا ثبت‌نام، با",
        and: "و",
        agreeEnd: "موافقت می‌کنی.",
        requiredEmail: "ایمیل الزامی است",
        invalidEmail: "فرمت ایمیل صحیح نیست",
        requiredPassword: "رمز عبور الزامی است",
        shortPassword: "رمز عبور باید حداقل ۶ کاراکتر باشد",
        invalidLogin: "ایمیل یا رمز عبور اشتباه است",
        alreadyRegistered: "این ایمیل قبلاً ثبت‌نام شده است",
        emailNotConfirmed: "لطفاً ایمیل خود را تأیید کنید",
        unknownError: "خطایی رخ داده است"
    },
    en: {
        login: "Login",
        register: "Sign Up",
        welcome: "Welcome back! Fast and secure login.",
        join: "Create a new account and join us!",
        email: "Email",
        password: "Password",
        placeholderEmail: "example@gmail.com",
        placeholderPassword: "Password",
        noAccount: "Don't have an account?",
        haveAccount: "Already have an account?",
        switchToRegister: "Sign Up",
        switchToLogin: "Login",
        terms: "Terms of Service",
        privacy: "Privacy Policy",
        agree: "By logging in or signing up, you agree to the",
        and: "and",
        agreeEnd: ".",
        requiredEmail: "Email is required",
        invalidEmail: "Invalid email format",
        requiredPassword: "Password is required",
        shortPassword: "Password must be at least 6 characters",
        invalidLogin: "Invalid email or password",
        alreadyRegistered: "This email is already registered",
        emailNotConfirmed: "Please confirm your email",
        unknownError: "An error occurred"
    }
};

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>("login");
    const [lang, setLang] = useState<Lang>('fa');
    const t = texts[lang];
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { signIn, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) router.push("/feed");
    }, [user, router]);

    // If mode is register, show MultiStepSignUp component
    if (mode === "register") {
        return <MultiStepSignUp />;
    }

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.email) newErrors.email = t.requiredEmail;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t.invalidEmail;
        if (!formData.password) newErrors.password = t.requiredPassword;
        else if (formData.password.length < 6) newErrors.password = t.shortPassword;
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setErrors({});
        try {
            await signIn(formData.email, formData.password);
        } catch (error: unknown) {
            const errMsg = typeof error === 'object' && error && 'message' in error ? (error as { message?: string }).message : undefined;
            if (errMsg?.includes("Invalid login credentials")) setErrors({ general: t.invalidLogin });
            else if (errMsg?.includes("User already registered")) setErrors({ email: t.alreadyRegistered });
            else if (errMsg?.includes("Email not confirmed")) setErrors({ general: t.emailNotConfirmed });
            else setErrors({ general: errMsg || t.unknownError });
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    return (
        <div className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black ${lang === 'fa' ? 'font-vazir' : ''}`}
            dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <div className="absolute top-6 left-6 right-6 flex justify-end z-20">
                <button
                    onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
                    className="px-3 py-1 rounded-full text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all"
                >
                    {lang === 'fa' ? 'EN' : 'فا'}
                </button>
            </div>
            <div className="w-full max-w-md mx-auto p-8 rounded-3xl shadow-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 relative">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Logo size="lg" variant={"default"} />
                </div>
                {/* Title */}
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
                        {t.login + ' ' + 'به ویستا'}
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-300 text-base">
                        {t.welcome}
                    </p>
                </div>
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {errors.general && (
                        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-2 rounded-xl text-sm text-center">
                            {errors.general}
                        </div>
                    )}
                    <Input
                        label={t.email}
                        type="email"
                        placeholder={t.placeholderEmail}
                        value={formData.email}
                        onChange={handleInputChange("email")}
                        error={errors.email}
                        icon={<Mail size={18} />}
                        className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    />
                    <Input
                        label={t.password}
                        type={showPassword ? "text" : "password"}
                        placeholder={t.placeholderPassword}
                        value={formData.password}
                        onChange={handleInputChange("password")}
                        error={errors.password}
                        icon={
                            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-zinc-400 dark:text-zinc-500">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        }
                        className="bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    />
                    <Button
                        type="submit"
                        size="lg"
                        loading={loading}
                        className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 border border-zinc-900 dark:border-white shadow-md transition-all duration-200"
                    >
                        {t.login}
                    </Button>
                </form>
                {/* Switch mode */}
                <div className="mt-8 text-center">
                    <span className="text-zinc-500 dark:text-zinc-300">
                        {t.noAccount}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setMode("register");
                            setErrors({});
                            setFormData({ email: "", password: "" });
                        }}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {t.switchToRegister}
                    </Button>
                </div>
                {/* Footer */}
                <div className="text-center mt-8 text-xs text-zinc-400 dark:text-zinc-500">
                    <p>
                        {t.agree}
                        <a href="#" className="mx-1 text-blue-500 hover:underline">{t.terms}</a>
                        {` ${t.and} `}
                        <a href="#" className="mx-1 text-purple-500 hover:underline">{t.privacy}</a>
                        {` ${t.agreeEnd}`}
                    </p>
                </div>
            </div>
        </div>
    );
}
