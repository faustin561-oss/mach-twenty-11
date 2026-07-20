import { prisma } from "./prisma";

// Thin wrapper around Notification creation. In-app only for now — email/
// SMS fan-out (Resend/Twilio, both already in package.json) is not wired
// here yet; see README roadmap.
export async function notify(userId: string, title: string, body: string) {
  return prisma.notification.create({ data: { userId, title, body } });
}

export async function notifyMany(userIds: string[], title: string, body: string) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, title, body })),
  });
}
