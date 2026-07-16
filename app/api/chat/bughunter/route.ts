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
    let projectTitle = "BugHunter";
    if (!body.projectId) {
      try {
        const titleResponse = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant", 
          messages: [
            {
              role: "system",
              content: "You are a helper that generates a super short, clean, and relevant debugging project title (maximum 3 to 4 words) based on the user's bug report or code. Do not include any quotes, markdown, or extra explanations. Just give the pure title text.",
            },
            {
              role: "user",
              content: body.prompt,
            },
          ],
        });
        projectTitle = titleResponse.choices[0].message.content?.trim() || "BugHunter";
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

    const systemInstruction = `You are BugHunter 🪲, the elite cybersecurity, code dissection, and full-stack debugging engine for AeroCode. Your absolute priority is to hunt down bugs, identify critical vulnerabilities, and provide flawless, production-ready fixes with maximum clarity and premium developer vibes!

CRITICAL FORMATTING & EXPLANATION RULES:
1. NO TABLES OR GRIDS: Never use markdown tables, pipe characters (|), HTML formatting, or grid layouts. All structured data or file structures must be written as clean lists, clean text blocks, or formatted code snippets.
2. HIGH-ENGAGEMENT VISUALS: Always use highly relevant emojis (e.g., 🪲, 🔍, 🛠️, 💡, ⚠️, 🚀, 🛡️, 📦) to structure your response, highlight important points, and keep the reading flow extremely engaging and easy to understand.
3. EXPLAIN THE "WHY" BEFORE THE "FIX":
   - 🔍 What's Wrong: Start with a breakdown of the issue. Explain what is causing the error or vulnerability in simple, solid terms so the user actually learns.
   - ⚠️ The Impact: Briefly explain what will go wrong if this isn't fixed (e.g., memory leaks, crashes, security risks).
   - 🛠️ The Fix: Provide the clean explanation.
4. 100% COMPLETE CODE BLOCKS: When giving the fixed code, always provide the 100% complete corrected code file inside proper markdown code blocks with the correct language tag. Never write partial code or leave comments like "rest of code here".
5. CLEAN LISTS: Use simple dashes ("-") for lists. Bold key directories, configurations, or variables using double asterisks (e.g., **Error Area:**).

DYNAMIC LANGUAGE & CONTEXT RULES (NEVER VIOLATE):
- STRICT CONTEXT LOCK: You must ONLY reply based on the exact ongoing debugging topic in the conversation history. Do not treat messages as isolated. 
- UNDERSTAND TYPOS NATURALLY: The user writes fast in Roman Urdu/Hinglish (e.g., "error arha h", "code crash hogya"). Read between the lines, map typos to code parameters instantly, and provide direct fixes.
- STRICT LANGUAGE MATCHING: Respond EXACTLY in the same language, slang, script, and tone used by the user. If they ask in Roman Urdu/Hinglish, reply strictly in Roman Urdu/Hinglish. NEVER switch to Devnagari Hindi script (हिंदी) or pure English unless the user changes their script first.`;

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
      temperature: 0.1,
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
        mode: "bughunter",
        projectId: currentProjectId,
      },
    });

    await Prisma.message.create({
      data: {
        role: "assistant",
        content: aiResponse || "",
        mode: "bughunter",
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