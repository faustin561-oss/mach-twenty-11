import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getUploadUrl } from "@/lib/s3";
import { handleApiError } from "@/lib/api-error";

const schema = z.object({ fileName: z.string().min(1), contentType: z.string().min(1) });

// POST /api/uploads/presign — issues a short-lived S3 PUT URL for shipment
// photos/documents. Requires AWS_* env vars; without them this 500s, which
// is the correct behavior rather than silently faking a URL.
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    try {
      const result = await getUploadUrl(parsed.data.fileName, parsed.data.contentType);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ error: "Upload service not configured. Set AWS_* env vars." }, { status: 500 });
    }

  } catch (err) {
    return handleApiError(err);
  }
}
