import { NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/status`, {
      headers: { "ngrok-skip-browser-warning": "true" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { connected: false, message: "No se puede alcanzar el servidor" },
      { status: 503 }
    );
  }
}
