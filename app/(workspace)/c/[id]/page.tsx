import Prisma from "@/lib/prisma";
import ChatPage from "./chatpage"; 
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  if (!id) {
    return notFound();
  }

  // 2. Database query execution
  const messages = await Prisma.message.findMany({
    where: {
      projectId: id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // 3. Fallback engine mapping agar chat bilkul nayi hai
  const projectMode = messages.length > 0 && messages[0].mode ? messages[0].mode : "blueprint";
  
  return <ChatPage messages={messages} projectId={id} mode={projectMode} />;
}