import prisma from "@/lib/prisma";
import Sidebar from "./Sidebar";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SidebarServer() {
  let userId = "";

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (token) {
      const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as {
        id: string;
        email: string;
      };
      userId = decoded.id;
    }
  } catch (err) {
    console.error("Sidebar auth parsing error:", err);
  }

  if (!userId) {
    return <Sidebar projects={[]} />;
  }

  const projects = await prisma.project.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return <Sidebar projects={projects} />;
}