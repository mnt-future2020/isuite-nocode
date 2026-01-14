"use server";

export async function exchangeGoogleToken({
    code,
    clientId,
    clientSecret,
    redirectUri,
}: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}) {
    console.log("Exchanging token with:", { clientId, redirectUri, codeLength: code.length });

    try {
        const params = new URLSearchParams();
        params.append("code", code);
        params.append("client_id", clientId);
        params.append("client_secret", clientSecret);
        params.append("redirect_uri", redirectUri);
        // Important: 'authorization_code' grant type
        params.append("grant_type", "authorization_code");

        const response = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Token exchange failed:", data);
            throw new Error(data.error_description || data.error || "Failed to exchange token");
        }

        // Optionally fetch user profile to get email
        let userEmail = "";
        if (data.access_token) {
            try {
                const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
                    headers: { Authorization: `Bearer ${data.access_token}` },
                });
                if (userRes.ok) {
                    const userData = await userRes.json();
                    userEmail = userData.email;
                }
            } catch (e) {
                console.error("Failed to fetch user info", e);
            }
        }

        return {
            refresh_token: data.refresh_token,
            access_token: data.access_token, // usually not persisted permanently if we rely on refresh, but good to have
            email: userEmail,
        };
    } catch (error) {
        console.error("Server action error:", error);
        throw new Error(error instanceof Error ? error.message : "Internal Server Error during token exchange");
    }
}
