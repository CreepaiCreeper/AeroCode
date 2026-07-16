import Prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";
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
    let projectTitle = "blueprint";
    if (!body.projectId) {
      try {
        const titleResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile", 
          messages: [
            {
              role: "system",
              content: "You are a helper that generates a super short, clean, and relevant project title (maximum 3 to 4 words) based on the user's prompt. Do not include any quotes, markdown, or extra explanations. Just give the pure title text.",
            },
            {
              role: "user",
              content: body.prompt,
            },
          ],
        });
        projectTitle = titleResponse.choices[0].message.content?.trim() || "blueprint";
      } catch (err) {
        console.error("Title generation failed, using default", err);
      }
    }

    let previousMessages: { role: "user" | "assistant"; content: string }[] = [];
    if (body.projectId) {
      // 🛠️ FIX: Latest context parsing using desc logic
      const dbMessages = await Prisma.message.findMany({
        where: { projectId: body.projectId },
        orderBy: { createdAt: "desc" },
        take: 12,
      });

      previousMessages = dbMessages.reverse().map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));
    }

    const systemInstruction = `You are Blueprint 📐, the elite full-stack software architect, systems design engine, and engineering lead for AeroCode. Your absolute priority is to transform raw project ideas into detailed architectural blueprints with premium engineering vibes!

CRITICAL FORMATTING & EXPLANATION RULES:
1. DYNAMIC LANGUAGE ADAPTATION & MATCHING: You must explain the entire architecture, endpoints, and workflows EXACTLY in the same language and slang script used by the user. If they ask or explain in Roman Urdu/Hinglish (e.g., "auth setup krwado", "db schemas btao"), your explanation prose must be strictly in Roman Urdu/Hinglish. If they speak in English, reply in English. Code snippets remain standard technical code. NEVER use Devnagari Hindi (हिंदी).
2. NO TABLES OR GRIDS: Never use markdown tables, pipe characters (|), HTML formatting, or grid layouts. Write all database schemas, APIs, or folder structures as clean bulleted text lists or formatted code blocks.
3. HIGH-ENGAGEMENT VISUALS: Structure your system architectures using highly relevant, clean emojis (e.g., 📐, 💾, 📁, 🔑, 🛡️, 🌐, 🚀) to make complex structures look readable.
4. SCALABILITY-FIRST ARCHITECTURE BREAKDOWN:
   - 📐 System Architecture & Flow: Explain core logic and tech stack.
   - 📁 Folder Structure: Complete folder tree inside \`\`\`bash ... \`\`\` blocks.
   - 💾 Database Schema: Schemas inside syntax code blocks (e.g., prisma or SQL).
   - 🔌 API Endpoints: Bullet points with Methods, Paths, Payload, and Responses.
5. BOLDING & LISTS: Use simple dashes ("-") for bullet points. Bold key items using double asterisks (e.g., **/app/(workspace):**).

DYNAMIC CONTEXT RULES (NEVER VIOLATE):
- STRICT CONTEXT LOCK: You must ONLY reply based on the exact ongoing topic in the conversation history. Do not treat messages as isolated. Always build upon previous architectural choices.
- UNDERSTAND TYPOS NATURALLY: Infer code intent and typos effortlessly without breaking character.`;

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

    })

    const aiResponse = response.choices[0].message.content?.trim();

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
        mode: "blueprint",
        projectId: currentProjectId,
      },
    });

    await Prisma.message.create({
      data: {
        role: "assistant",
        content: aiResponse,
        mode: "blueprint",
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