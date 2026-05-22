import { config } from "dotenv";

config();
config({ path: ".env.local" });

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");

  const booked = await prisma.mailOutreach.findMany({
    where: { status: "booked" },
    include: {
      appointment: true,
      business: { select: { name: true, email: true } },
    },
  });

  console.log("=== MailOutreach status=booked ===\n");
  for (const b of booked) {
    console.log({
      businessName: b.business?.name,
      recipientEmail: b.recipientEmail,
      bookedAt: b.bookedAt?.toISOString() ?? null,
      sentAt: b.sentAt?.toISOString() ?? null,
      appointmentId: b.appointmentId,
      hasAppointmentRow: !!b.appointment,
      appointment: b.appointment
        ? {
            scheduledAt: b.appointment.scheduledAt.toISOString(),
            createdAt: b.appointment.createdAt.toISOString(),
            email: b.appointment.email,
            contactName: b.appointment.contactName,
            notes: b.appointment.notes,
          }
        : null,
    });
    console.log("");
  }

  const apts = await prisma.appointment.findMany({
    orderBy: { createdAt: "desc" },
  });
  console.log(`=== Appointments in DB (${apts.length} total) ===\n`);
  for (const a of apts) {
    console.log({
      id: a.id.slice(0, 8) + "…",
      businessName: a.businessName,
      email: a.email,
      source: a.source,
      scheduledAt: a.scheduledAt.toISOString(),
      createdAt: a.createdAt.toISOString(),
    });
  }

  const orphanBooked = booked.filter((b) => b.appointmentId && !b.appointment);
  if (orphanBooked.length) {
    console.log("\n=== Orphan booked (appointmentId set but row deleted) ===");
    for (const b of orphanBooked) {
      console.log(b.business?.name, b.appointmentId, b.bookedAt);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [draft, sent, sentToday] = await Promise.all([
    prisma.mailOutreach.count({ where: { status: "draft" } }),
    prisma.mailOutreach.count({ where: { status: "sent" } }),
    prisma.mailOutreach.count({
      where: { status: "sent", sentAt: { gte: today } },
    }),
  ]);
  console.log("\n=== Tellingen ===");
  console.log({ draft, sent, sentToday });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    const { prisma } = await import("../src/lib/db/prisma");
    await prisma.$disconnect();
  });
