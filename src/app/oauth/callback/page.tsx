"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (window.opener) {
            if (code) {
                window.opener.postMessage({ type: "OAUTH_RESPONSE", code }, "*");
            } else if (error) {
                window.opener.postMessage({ type: "OAUTH_RESPONSE", error }, "*");
            }
            window.close();
        }
    }, [searchParams]);

    return (
        <div className="flex items-center justify-center h-screen bg-background">
            <div className="text-center">
                <h1 className="text-xl font-semibold mb-2">Authenticating...</h1>
                <p className="text-muted-foreground">You can close this window if it doesn't close automatically.</p>
            </div>
        </div>
    );
}
