import { channel, topic } from "@inngest/realtime";

export const PDF_GENERATOR_CHANNEL_NAME = "pdf-generator-execution";

export const pdfGeneratorChannel = channel(PDF_GENERATOR_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
            message?: string;
        }>(),
    );
