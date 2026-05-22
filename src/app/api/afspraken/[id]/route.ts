import { NextResponse } from "next/server";
import {
  deleteAppointment,
  updateAppointment,
  type UpdateAppointmentInput,
} from "@/lib/afspraken/storage";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const body = (await request.json()) as UpdateAppointmentInput;
    const appointment = await updateAppointment(id, body);
    if (!appointment) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    return NextResponse.json({ appointment });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json(
      { error: message },
      {
        status:
          message === "INVALID_MEET_LINK" || message === "SLOT_TAKEN" ? 400 : 500,
      },
    );
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const ok = await deleteAppointment(id);
  if (!ok) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
