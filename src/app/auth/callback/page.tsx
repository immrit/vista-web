"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
    const router = useRouter();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (access_token && refresh_token) {
            fetch("/api/auth/set-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ access_token, refresh_token }),
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        router.replace("/feed");
                    } else {
                        alert("ورود ناموفق بود! " + (data.error || ""));
                    }
                });
        } else {
            alert("توکن معتبر پیدا نشد!");
        }
    }, [router]);

    return (
        <div style={{ textAlign: "center", marginTop: 100 }}>
            <h2>در حال ورود به حساب کاربری...</h2>
        </div>
    );
} 