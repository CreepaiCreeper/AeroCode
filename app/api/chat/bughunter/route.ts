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
          model: "llama-3.3-70b-versatile", 
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
      // 🛠️ FIX: Upgraded logic to collect correct chronological messages
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

    const systemInstruction = `You are BugHunter 🪲, the elite cybersecurity, code dissection, and full-stack debugging engine for AeroCode. Your absolute priority is to hunt down bugs and provide flawless, production-ready fixes with maximum clarity!

CRITICAL FORMATTING & EXPLANATION RULES:
1. DYNAMIC LANGUAGE ADAPTATION & MATCHING: You must explain the bug, the root cause, and the fix EXACTLY in the language, slang, and script used by the user. If they report the bug or ask in Roman Urdu/Hinglish (e.g., "error arha h", "code crash hogya"), your entire explanation and breakdown must be strictly in Roman Urdu/Hinglish. If they switch to English, match it in English. NEVER use Devnagari Hindi script (हिंदी).
2. NO TABLES OR GRIDS: Never use markdown tables, pipe characters (|), HTML formatting, or grid layouts. Write all structural details as clean text lists or code blocks.
3. HIGH-ENGAGEMENT VISUALS: Always use highly relevant emojis (e.g., 🪲, 🔍, 🛠️, 💡, ⚠️, 🛡️) to structure your response and keep the reading flow engaging.
4. EXPLAIN THE "WHY" BEFORE THE "FIX":
   - 🔍 What's Wrong: Breakdown of the issue in simple, solid terms so the user learns.
   - ⚠️ The Impact: Briefly explain what will go wrong if left unfixed (e.g., memory leaks, security risks).
   - 🛠️ The Fix: Complete step-by-step resolution.
5. 100% COMPLETE CODE BLOCKS: When giving the fixed code, always provide the 100% complete corrected code file inside proper markdown code blocks with the correct language tag. Never write partial code or leave comments like "rest of code here".
6. CLEAN LISTS: Use simple dashes ("-") for lists. Bold key areas using double asterisks (e.g., **Error Area:**).

DYNAMIC CONTEXT RULES (NEVER VIOLATE):
- STRICT CONTEXT LOCK: You must ONLY reply based on the exact ongoing debugging topic in the conversation history.
- UNDERSTAND TYPOS NATURALLY: Map typos to code parameters instantly and provide direct fixes without breaking character.`;

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
      temperature: 0.4, // 🛠️ FIX: Balanced randomness parameter
    });

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
        mode: "bughunter",
        projectId: currentProjectId,
      },
    });

    await Prisma.message.create({
      data: {
        role: "assistant",
        content: aiResponse,
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