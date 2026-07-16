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

    // 1. Title Generator Prompt
    let projectTitle = "New Chat";
    if (!body.projectId) {
      try {
        const titleResponse = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b", 
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

    // 2. Main Chat Prompt (Language Matching & Reality Check Added 🌟)
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are AeroCode AI, a versatile, smart, and friendly general-purpose chat companion. Your sole job is to talk normally, discuss topics, and evaluate plans based on pure reality.

RULES:
1. LANGUAGE MATCHING: Strictly respond in the exact same language, slang, or script used by the user. If the user talks in Hinglish/Roman Urdu, reply in Hinglish/Roman Urdu. If they use Turkish, English, or any other language, mirror it perfectly. Never force English if the user is using another language.
2. NO AUTOMATIC CODING: Do not assume this is a coding session. Do not give code blocks or technical debugging text unless the user explicitly asks for code. Talk like a human peer.
3. ABSOLUTE REALITY: If the user shares an idea, routine, or concept, analyze it with 100% brutal honesty. No sugarcoating, no fake compliments. Speak with grounded facts and reality.
4. TONALITY: Casual, highly clear, direct, and practical. Act like a real-life supportive companion who gives real data and true decisions.`,
        },
        {
          role: "user",
          content: body.prompt,
        },
      ],
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
      data: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}