import { googleSheetsChannel } from "@/inngest/channels/google-sheets";
import type { NodeExecutor } from "../../types";
import { resolveExpressions } from "@/lib/expression-engine";
import prisma from "@/lib/db";
import { google } from "googleapis";

type GoogleSheetsOperation = 'READ_ROWS' | 'APPEND_ROW' | 'UPDATE_ROW' | 'CLEAR_SHEET';

interface GoogleSheetsData {
    operation: GoogleSheetsOperation;
    spreadsheetId: string;
    sheetName: string;
    range?: string;
    data?: string;
    variableName: string;
    credentialId: string;
}

export const googleSheetsExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const {
        operation,
        spreadsheetId,
        sheetName,
        range,
        data: inputData,
        variableName,
        credentialId
    } = data as unknown as GoogleSheetsData;

    if (!credentialId) {
        throw new Error("Google Sheets credential is required");
    }

    const updateStatus = async (status: "loading" | "success" | "error", message?: string) => {
        try {
            await publish(
                googleSheetsChannel().status({
                    nodeId,
                    status,
                    message
                })
            );
        } catch (e) {
            console.error("Status publish failed:", e);
        }
    };

    await updateStatus("loading");

    try {
        const result = await step.run(`google-sheets-${nodeId}`, async () => {
            // Fetch credential
            const credential = await prisma.credential.findUnique({
                where: { id: credentialId },
            });

            if (!credential) {
                throw new Error(`Credential not found: ${credentialId}`);
            }

            let sheetsConfig;
            try {
                sheetsConfig = JSON.parse(credential.value);
            } catch (e) {
                throw new Error("Invalid Google Sheets credential configuration");
            }

            const { clientId, clientSecret, refreshToken } = sheetsConfig;

            if (!clientId || !clientSecret || !refreshToken) {
                throw new Error("Google Sheets credential missing required OAuth2 fields");
            }

            // Setup Auth
            const auth = new google.auth.OAuth2(clientId, clientSecret);
            auth.setCredentials({ refresh_token: refreshToken });
            const sheets = google.sheets({ version: 'v4', auth });

            // Resolve expressions
            const resolved = resolveExpressions({
                spreadsheetId,
                sheetName,
                range: range || "A:Z",
                data: inputData || ""
            }, context);

            const fullRange = `${resolved.sheetName}!${resolved.range}`;

            if (operation === 'READ_ROWS') {
                const res = await sheets.spreadsheets.values.get({
                    spreadsheetId: resolved.spreadsheetId,
                    range: fullRange,
                });

                const rows = res.data.values || [];
                if (rows.length === 0) return [];

                const headers = rows[0];
                return rows.slice(1).map(row => {
                    const obj: any = {};
                    headers.forEach((header: string, index: number) => {
                        obj[header] = row[index];
                    });
                    return obj;
                });
            }

            if (operation === 'APPEND_ROW') {
                let valuesToAppend: any[] = [];
                try {
                    // Try to parse as JSON array
                    const parsed = JSON.parse(resolved.data);
                    valuesToAppend = Array.isArray(parsed) ? (Array.isArray(parsed[0]) ? parsed : [parsed]) : [Object.values(parsed)];
                } catch (e) {
                    // Fallback to comma separated
                    valuesToAppend = [resolved.data.split(',').map((s: string) => s.trim())];
                }

                const res = await sheets.spreadsheets.values.append({
                    spreadsheetId: resolved.spreadsheetId,
                    range: fullRange,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: valuesToAppend,
                    },
                });
                return res.data;
            }

            if (operation === 'UPDATE_ROW') {
                let valuesToUpdate: any[] = [];
                try {
                    const parsed = JSON.parse(resolved.data);
                    valuesToUpdate = Array.isArray(parsed) ? (Array.isArray(parsed[0]) ? parsed : [parsed]) : [Object.values(parsed)];
                } catch (e) {
                    valuesToUpdate = [resolved.data.split(',').map((s: string) => s.trim())];
                }

                const res = await sheets.spreadsheets.values.update({
                    spreadsheetId: resolved.spreadsheetId,
                    range: fullRange,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: valuesToUpdate,
                    },
                });
                return res.data;
            }

            if (operation === 'CLEAR_SHEET') {
                const res = await sheets.spreadsheets.values.clear({
                    spreadsheetId: resolved.spreadsheetId,
                    range: fullRange,
                });
                return res.data;
            }

            throw new Error(`Unsupported operation: ${operation}`);
        });

        await updateStatus("success");

        return {
            [variableName || "sheets_data"]: result,
        };
    } catch (error) {
        await updateStatus("error", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
