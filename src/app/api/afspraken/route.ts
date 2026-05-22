import { NextResponse } from "next/server";
import {
  createAppointment,
  listAfspraken,
  type CreateAppointmentInput,
} from "@/lib/afspraken/storage";

export async function GET(request: Request) {
  const week = new URL(request.url).searchParams.get("week") ?? undefined;
  const data = await listAfspraken(week ?? undefined);
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateAppointmentInput;
    const appointment = await createAppointment(body);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    const status =
      message === "INVALID_MEET_LINK" ||
      message === "BUSINESS_NAME_REQUIRED" ||
      message === "SLOT_TAKEN"
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
