import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = (session as unknown as { user: { role: string } }).user.role;
  if (role === "SUPERADMIN") redirect("/admin");
  if (role === "PEMBIMBING" || role === "ADMIN") redirect("/pembimbing");
  redirect("/siswa");
}
