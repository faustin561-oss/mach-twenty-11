import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const notification = await prisma.notification.findUnique({ where: { id: id } });
    if (!notification || notification.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.notification.update({ where: { id: id }, data: { read: true } });
    return NextResponse.json({ read: true });

  } catch (err) {
    return handleApiError(err);
  }
}
