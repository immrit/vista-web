"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { persistAuthTokens } from "@/lib/apiClient";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const handleAuth = async () => {
            const params = new URLSearchParams(window.location.search);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");

            if (access_token) {
                // Use the secure server-side route to set HttpOnly cookies
                // NEVER write to localStorage
                await persistAuthTokens(access_token, refresh_token ?? undefined);
                router.replace("/feed");
            } else {
                router.replace("/auth");
            }
        };

        handleAuth();
    }, [router]);

    return (
        <div style={{ textAlign: "center", marginTop: 100 }}>
            <h2>در حال ورود به حساب کاربری...</h2>
        </div>
    );
}