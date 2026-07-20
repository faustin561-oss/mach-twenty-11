import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({ name: z.string().min(1), phone: z.string().optional() });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true, carrierProfile: true },
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const user = await prisma.user.update({
      where: { id: (session.user as any).id },
      data: parsed.data,
    });
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
