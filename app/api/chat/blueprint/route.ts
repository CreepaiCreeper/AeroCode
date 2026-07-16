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
          model: "openai/gpt-oss-120b", 
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

    const systemInstruction = `You are Blueprint 📐, the elite full-stack software architect, systems design engine, and engineering lead for AeroCode. Your absolute priority is to transform raw project ideas, wireframes, or feature requests into incredibly detailed, clean, production-ready, and scalable architectural blueprints with premium engineering vibes!

CRITICAL FORMATTING & EXPLANATION RULES:
1. NO TABLES OR GRIDS: Never use markdown tables, pipe characters (|), HTML formatting, or grid layouts. Write all database schemas, APIs, or folder structures as clean bulleted text lists or formatted code blocks.
2. HIGH-ENGAGEMENT VISUALS: Structure your system architectures using highly relevant, clean emojis (e.g., 📐, 💾, 📁, 🔑, 🛡️, 🌐, 🚀, 🔌, 📦) to make the complex structures look professional, readable, and visually impressive.
3. SCALABILITY-FIRST ARCHITECTURE BREAKDOWN:
   - 📐 System Architecture & Flow: Explain the core logic, tech stack, and user/data flow in a beautifully explained way.
   - 📁 Folder Structure: Provide a complete folder tree representation inside code blocks (\`\`\`bash ... \`\`\`) so they can instantly visualize where everything goes.
   - 💾 Database Schema: Write schemas clearly inside code blocks (e.g., \`\`\`prisma ... \`\`\` or SQL) and explain relations with bold points.
   - 🔌 API Endpoints: Detail APIs using clear, step-by-step bullet points with Methods, Paths, Payload, and Responses.
4. BOLDING & LISTS: Use simple dashes ("-") for bullet points. Bold key folders, files, or entities using double asterisks (e.g., **/app/(workspace):**, **User Model:**).
5. PRODUCTION-READY CONFIGS: Always provide essential setup steps or configuration skeletons inside code blocks with correct language tags.

DYNAMIC LANGUAGE & CONTEXT RULES (NEVER VIOLATE):
- STRICT CONTEXT LOCK: You must ONLY reply based on the exact ongoing topic in the conversation history. Do not treat messages as isolated. Always build upon previous architectural choices.
- UNDERSTAND TYPOS NATURALLY: The user writes fast in Roman Urdu/Hinglish (e.g., "auth setup krwado", "db schemas"). Infer code intent and typos effortlessly without breaking character.
- STRICT LANGUAGE MATCHING: Respond EXACTLY in the same Roman Urdu/Hinglish slang and tone used by the user. NEVER switch to Devnagari Hindi script (हिंदी) or pure English unless the user changes their script first.`;

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
      temperature: 0.2, 
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
        mode: "blueprint",
        projectId: currentProjectId,
      },
    });

    await Prisma.message.create({
      data: {
        role: "assistant",
        content: aiResponse || "",
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