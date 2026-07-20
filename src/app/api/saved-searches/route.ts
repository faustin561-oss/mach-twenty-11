import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { toJsonFilters, fromJsonFilters } from "@/lib/json-filters";

const schema = z.object({ name: z.string().min(1), filters: z.record(z.any()) });

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const searches = await prisma.savedSearch.findMany({
      where: { userId: (session.user as any).id },
      orderBy: { createdAt: "desc" },
    });
    // filters is stored as a JSON-encoded string (see prisma/schema.prisma
    // comment); deserialize before returning so the client contract
    // (LoadBoardClient.tsx expects an object) is unchanged.
    const withParsedFilters = searches.map((s) => ({ ...s, filters: fromJsonFilters(s.filters) }));
    return NextResponse.json({ searches: withParsedFilters });

  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const search = await prisma.savedSearch.create({
      data: { userId: (session.user as any).id, name: parsed.data.name, filters: toJsonFilters(parsed.data.filters) as any },
    });
    return NextResponse.json({ search: { ...search, filters: parsed.data.filters } }, { status: 201 });

  } catch (err) {
    return handleApiError(err);
  }
}
