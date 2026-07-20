import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const search = await prisma.savedSearch.findUnique({ where: { id: id } });
    if (!search || search.userId !== (session.user as any).id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.savedSearch.delete({ where: { id: id } });
    return NextResponse.json({ deleted: true });

  } catch (err) {
    return handleApiError(err);
  }
}
