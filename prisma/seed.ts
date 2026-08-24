import { PrismaClient, Priority, ComplaintStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 12);
  const residentHash = await bcrypt.hash("Resident@123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@atrium.local" },
    update: {},
    create: {
      email: "admin@atrium.local",
      name: "Society Admin",
      role: Role.ADMIN,
      passwordHash,
      unitNumber: "Office",
      phone: "0000000000",
    },
  });

  const resident = await prisma.user.upsert({
    where: { email: "resident@atrium.local" },
    update: {},
    create: {
      email: "resident@atrium.local",
      name: "Priya Sharma",
      role: Role.RESIDENT,
      passwordHash: residentHash,
      unitNumber: "B-204",
      phone: "9876543210",
    },
  });

  const categories = [
    { name: "Plumbing", description: "Leaks, drainage, water supply", sortOrder: 1 },
    { name: "Electrical", description: "Lights, wiring, outages", sortOrder: 2 },
    { name: "Housekeeping", description: "Common area cleanliness", sortOrder: 3 },
    { name: "Security", description: "Access, CCTV, visitor issues", sortOrder: 4 },
    { name: "Parking", description: "Slots, unauthorized vehicles", sortOrder: 5 },
    { name: "Civil", description: "Walls, plaster, seepage, doors", sortOrder: 6 },
  ];

  const createdCategories = [];
  for (const category of categories) {
    createdCategories.push(
      await prisma.category.upsert({
        where: { name: category.name },
        update: category,
        create: category,
      }),
    );
  }

  await prisma.appSetting.upsert({
    where: { key: "overdueThresholdHours" },
    update: {},
    create: { key: "overdueThresholdHours", value: "48" },
  });

  const existing = await prisma.complaint.count();
  if (existing === 0) {
    const plumbing = createdCategories.find((c) => c.name === "Plumbing")!;
    const electrical = createdCategories.find((c) => c.name === "Electrical")!;

    const open = await prisma.complaint.create({
      data: {
        ticketNo: "SMT-00001",
        categoryId: plumbing.id,
        description: "Kitchen sink in B-204 has been dripping overnight and the cabinet below is damp.",
        priority: Priority.HIGH,
        status: ComplaintStatus.OPEN,
        createdById: resident.id,
      },
    });

    await prisma.complaintStatusHistory.create({
      data: {
        complaintId: open.id,
        fromStatus: null,
        toStatus: ComplaintStatus.OPEN,
        note: "Complaint registered by resident.",
        actorId: resident.id,
      },
    });

    const inProgress = await prisma.complaint.create({
      data: {
        ticketNo: "SMT-00002",
        categoryId: electrical.id,
        description: "Staircase light on B-wing 2nd floor flickers after sunset.",
        priority: Priority.MEDIUM,
        status: ComplaintStatus.IN_PROGRESS,
        createdById: resident.id,
        assignedToId: admin.id,
      },
    });

    await prisma.complaintStatusHistory.createMany({
      data: [
        {
          complaintId: inProgress.id,
          fromStatus: null,
          toStatus: ComplaintStatus.OPEN,
          note: "Complaint registered by resident.",
          actorId: resident.id,
        },
        {
          complaintId: inProgress.id,
          fromStatus: ComplaintStatus.OPEN,
          toStatus: ComplaintStatus.IN_PROGRESS,
          note: "Electrician scheduled for this evening.",
          actorId: admin.id,
        },
      ],
    });
  }

  if ((await prisma.notice.count()) === 0) {
    await prisma.notice.createMany({
      data: [
        {
          title: "Water tank cleaning on Sunday",
          body: "Overhead tanks will be cleaned between 9:00 and 13:00. Please store water in advance. Supply will resume by 14:00.",
          isPinned: true,
          isImportant: true,
          createdById: admin.id,
        },
        {
          title: "Society AGM reminder",
          body: "The annual general meeting is scheduled for the 12th at 6:30pm in the clubhouse. Agenda copies are at the office.",
          isPinned: false,
          isImportant: false,
          createdById: admin.id,
        },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("Admin     admin@atrium.local / Admin@123");
  console.log("Resident  resident@atrium.local / Resident@123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
