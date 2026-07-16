import Prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = request.cookies.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!);
    const payload = decoded as { id: string; email: string };

    const user = await Prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Title Generator Prompt
    let projectTitle = "New Chat";
    if (!body.projectId) {
      try {
        const titleResponse = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b", 
          messages: [
            {
              role: "system",
              content: "You are a helper that generates a clean, and relevant chat title (maximum 3 to 4 words) based on the user's message or topic discussed. Do not include any quotes, markdown, or extra explanations. Just give the pure title text.",
            },
            {
              role: "user",
              content: body.prompt,
            },
          ],
        });
        projectTitle = titleResponse.choices[0].message.content?.trim() || "New Chat";
      } catch (err) {
        console.error("Title generation failed, using default", err);
      }
    }

    // 🌟 FETCH PREVIOUS CHAT HISTORY (Context Maintenance)
    let previousMessages: { role: "user" | "assistant"; content: string }[] = [];
    if (body.projectId) {
      const dbMessages = await Prisma.message.findMany({
        where: { projectId: body.projectId },
        orderBy: { createdAt: "asc" },
        take: 10,
      });

      previousMessages = dbMessages.map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));
    }

    const systemInstruction = `You are AeroCode AI, a casual, smart, and highly relatable human-like chat companion. Your sole job is to talk normally, chill with the user, and evaluate topics based on pure reality.

CRITICAL BEHAVIORAL RULES:
1. UNDERSTAND TYPOS & HUMAN CONTEXT: The user writes fast and might make typos (e.g., "game" written as "agem", "PC ke liye" written as "pcmk ley"). NEVER interpret these typos as technical jargon, servers, or Linux commands unless explicitly asked. Read between the lines.
2. STRICT CONTEXT AWARENESS: You are having a continuous conversation. Always remember what the user said in the previous messages of this chat. Do not treat messages as isolated or new chats.
3. STRICT LANGUAGE MATCHING: Respond EXACTLY in the same language, slang, script, and tone used by the user. If the user writes in Roman Urdu/Hinglish (e.g., "main re pass decent pc hai"), reply STRICTLY in Roman Urdu/Hinglish. NEVER switch to Devnagari Hindi script (हिंदी) or pure English unless the user changes their script first.
4. NO AUTOMATIC CODING: Do NOT give code blocks, technical setup guides, or server debugging text unless strictly asked for programming help. Talk like a human peer.
5. ABSOLUTE REALITY: If the user shares an idea, routine, or concept, analyze it with 100% brutal honesty. No sugarcoating, no fake compliments. Speak with grounded facts and reality.`;

    // 🌟 Strict TypeScript explicit array definition to fix 'as any' errors
    const finalChatMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstruction },
      ...previousMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: body.prompt },
    ];

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: finalChatMessages,
    });

    const aiResponse = response.choices[0].message.content;
    let currentProjectId = body.projectId;
    let isNewProject = false;

    if (!currentProjectId) {
      const newProject = await Prisma.project.create({
        data: {
          title: projectTitle, 
          codeContent: body.prompt,
          userId: user.id,
        },
      });
      currentProjectId = newProject.id;
      isNewProject = true;
    }

    await Prisma.message.create({
      data: {
        role: "user",
        content: body.prompt,
        mode: "normal",
        projectId: currentProjectId,
      },
    });

    await Prisma.message.create({
      data: {
        role: "assistant",
        content: aiResponse || "",
        mode: "normal",
        projectId: currentProjectId,
      },
    });

    if (isNewProject) {
      revalidatePath("/", "layout");
    }

    return NextResponse.json({
      success: true,
      projectId: currentProjectId,
      data: aiResponse,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}