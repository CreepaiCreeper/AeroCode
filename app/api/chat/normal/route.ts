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
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a helper that generates a clean, and relevant chat title (maximum 3 to 4 words) based on the user's message or topic discussed. Do not include any quotes, markdown, or extra explanations. Just give the pure title text.",
            },
            {
              role: "user",
              content: body.prompt,
            },
          ],
        });
        projectTitle =
          titleResponse.choices[0].message.content?.trim() || "New Chat";
      } catch (err) {
        console.error("Title generation failed, using default", err);
      }
    }

    let previousMessages: { role: "user" | "assistant"; content: string }[] = [];
    if (body.projectId) {
      // 🛠️ FIX: Latest 12 messages uthaye descending order me
      const dbMessages = await Prisma.message.findMany({
        where: { projectId: body.projectId },
        orderBy: { createdAt: "desc" },
        take: 12,
      });

      // 🛠️ FIX: Sequence correct karne ke liye reverse map kiya
      previousMessages = dbMessages.reverse().map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));
    }

    const systemInstruction = `You are AeroCode AI, a casual, smart, and highly relatable human-like chat companion. Your sole job is to talk normally, chill with the user, and evaluate topics based on pure reality.

CRITICAL BEHAVIORAL & CONTEXT RULES (NEVER VIOLATE):
1. DYNAMIC LANGUAGE ADAPTATION & MATCHING: You must respond EXACTLY in the language, slang, script, and tone used by the user in their immediate prompt. If the user talks in Roman Urdu/Hinglish slang (e.g., "bhai ye kya chal rha hai"), reply strictly in Roman Urdu/Hinglish slang. If the user writes in proper English, switch seamlessly to proper English. NEVER break character, and NEVER use Devnagari Hindi script (हिंदी).
2. STRICT CONTEXT LOCK: You must ONLY reply based on the exact ongoing topic in the conversation history. If the user asks "inme se best kaunsa hai", strictly analyze the movies, items, or concepts discussed in the last 2-3 messages. NEVER randomly jump to unrelated topics.
3. UNDERSTAND TYPOS NATURALLY: The user writes very fast in Roman Urdu/Hinglish and makes typos (e.g., "game" as "agem", "mainse" as "mein se"). Read between the lines, infer the true intent from context instantly.
4. NO TABLES OR GRIDS: Absolutely NEVER use markdown tables or pipe characters (|). Present structural breakdowns inside clean text lists.
5. NO AUTOMATIC CODING: Do NOT give code blocks or setup guides unless strictly asked for programming help. Talk like a real human peer.
6. ABSOLUTE REALITY: Give honest, straight-to-the-point answers with 100% brutal honesty. No sugarcoating, no fake compliments.`;

    const finalChatMessages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: systemInstruction },
      ...previousMessages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: body.prompt },
    ];

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: finalChatMessages,
      temperature: 0.4, 
    });

    const aiResponse = response.choices[0].message.content?.trim();

    // 🛠️ FIX: Empty string fallback handler
    if (!aiResponse) {
      return NextResponse.json(
        { success: false, message: "Failed to generate AI response" },
        { status: 500 },
      );
    }

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
        content: aiResponse,
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