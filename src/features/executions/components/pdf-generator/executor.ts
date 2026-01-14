import { pdfGeneratorChannel } from "@/inngest/channels/pdf-generator";
import type { NodeExecutor } from "../../types";
import { createBinaryData } from "@/lib/binary";

interface PDFGeneratorData {
    variableName: string;
    htmlContent: string;
    fileName?: string;
}

export const pdfGeneratorExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { htmlContent, variableName, fileName } = data as unknown as PDFGeneratorData;

    const updateStatus = async (status: "loading" | "success" | "error", message?: string) => {
        try {
            await publish(
                pdfGeneratorChannel().status({
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
        const result = await step.run(`pdf-generator-${nodeId}`, async () => {
            if (!htmlContent) throw new Error("HTML content is required");

            // Simulation of PDF generation
            // In a real scenario, we'd use puppeteer or a service here
            const mockBase64 = "JVBERi0xLjQKJ... [mock data]";
            return createBinaryData(mockBase64, "application/pdf", fileName || "document.pdf");
        });

        await updateStatus("success");

        return {
            [variableName || "pdf_file"]: result,
        };
    } catch (error) {
        await updateStatus("error", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
