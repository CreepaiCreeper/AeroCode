import Prisma from "@/lib/prisma";
import ChatPage from "./chatpage";

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

  return <ChatPage messages={messages} projectId={id} />;
}