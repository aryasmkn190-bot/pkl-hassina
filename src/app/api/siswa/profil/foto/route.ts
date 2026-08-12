import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session as any)?.user?.role;
  const nis = (session as any)?.user?.nis;
  if (!role || role !== "SISWA" || !nis) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const file = form.get("foto") as File | null;
  if (!file || file.size === 0) return NextResponse.json({ error: "Pilih foto." }, { status: 400 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File harus gambar." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Maks 5MB." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const dir = path.join(process.env.UPLOAD_DIR ?? "/var/lib/pkl-hassina/uploads", "profil", nis);
  await mkdir(dir, { recursive: true });
  const ext = (file.name.split(".").pop() || "jpg").slice(0,4).replace(/[^a-z0-9]/gi,"") || "jpg";
  const name = `${Date.now()}.${ext}`;
  await writeFile(path.join(dir, name), buf);
  const url = `/uploads/profil/${nis}/${name}`;
  const updated = await prisma.siswa.update({ where: { nis }, data: { foto: url }, include: { dudi: true } });
  return NextResponse.json({ ok: true, data: updated });
}
