import { channel, topic } from "@inngest/realtime";

export const MYSQL_CHANNEL_NAME = "mysql-execution";

export const mysqlChannel = channel(MYSQL_CHANNEL_NAME)
    .addTopic(
        topic("status").type<{
            nodeId: string;
            status: "loading" | "success" | "error";
            message?: string;
        }>(),
    );
