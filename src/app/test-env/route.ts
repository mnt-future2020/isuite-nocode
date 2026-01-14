import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        db_url_exists: !!process.env.DATABASE_URL,
        db_url_start: process.env.DATABASE_URL?.substring(0, 20),
        node_env: process.env.NODE_ENV,
    });
}
