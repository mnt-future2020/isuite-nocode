import { channel, topic } from "@inngest/realtime";

export const SET_FIELDS_CHANNEL_NAME = "set-fields-execution";

export const setFieldsChannel = channel(SET_FIELDS_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
            message?: string;
        }>(),
    );
