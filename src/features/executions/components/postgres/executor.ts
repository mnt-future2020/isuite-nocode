import { postgresChannel } from "@/inngest/channels/postgres";
import type { NodeExecutor } from "../../types";

interface PostgresData {
    sql: string;
    variableName: string;
    credentialId: string;
}

export const postgresExecutor: NodeExecutor = async ({ data, context, step, nodeId, publish }) => {
    const { sql, variableName } = data as unknown as PostgresData;

    const updateStatus = async (status: "loading" | "success" | "error", message?: string) => {
        try {
            await publish(
                postgresChannel().status({
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
        const result = await step.run(`postgres-${nodeId}`, async () => {
            if (!sql) throw new Error("SQL query is required");

            // Simulation of DB query
            return [
                { id: 101, username: "admin", role: "superuser" }
            ];
        });

        await updateStatus("success");

        return {
            [variableName || "db_result"]: result,
        };
    } catch (error) {
        await updateStatus("error", error instanceof Error ? error.message : String(error));
        throw error;
    }
};
