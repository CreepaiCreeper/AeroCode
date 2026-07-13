import Prisma from "@/lib/prisma";
import ChatPage from "./chatpage";
import { notFound } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 1. Pehle messages fetch karo database se
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