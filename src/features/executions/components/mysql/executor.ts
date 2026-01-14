import { mysqlChannel } from "@/inngest/channels/mysql";
import type { NodeExecutor } from "../../types";

interface MySqlData {
    sql: string;
    variableName: string;
    credentialId: string;
}

export const mysqlExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { sql, variableName } = data as unknown as MySqlData;

    const updateStatus = async (status: "loading" | "success" | "error", message?: string) => {
        try {
            await publish(
                mysqlChannel().status({
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
        const result = await step.run(`mysql-${nodeId}`, async () => {
            if (!sql) throw new Error("SQL query is required");

            return [
                { id: 1, user: "mysql_admin", status: "active" }
            ];
        });

        await updateStatus("success");

        return {
            [variableName || "mysql_result"]: result,
        };
    } catch (error) {
        await updateStatus("error", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
