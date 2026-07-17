import Prisma from "@/lib/prisma";
import ChatPage from "./chatpage"; 

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const messages = await Prisma.message.findMany({
    where: {
      projectId: id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const projectMode = messages.length > 0 ? messages[0].mode : "bughunter";
  
  return <ChatPage messages={messages} projectId={id} mode={projectMode} />;
}