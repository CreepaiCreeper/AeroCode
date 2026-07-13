import Prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const token = request.cookies.get("token");

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
      },
      { status: 401 },
    );
  }
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!);
    const payload = decoded as {
      id: string;
      email: string;
    };

    const user = await Prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        { status: 404 },
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            `You are BugHunter, an elite debugging assistant for AeroCode. Analyze the code provided by the user, find bugs/errors, and provide a clear explanation.
             CRITICAL FORMATTING RULES:
             1. NEVER use markdown tables, pipe characters (|), or grid layouts.
             2. Use standard Markdown headings (e.g., "### 🔍 What's Wrong") for sections.
             3. Use simple bullet points starting with a dash ("-") for lists. Never use raw symbols or weird dividers.
             4. Bold key terms using double asterisks (e.g., **Issue:**).
             5. Always provide the 100% corrected code inside proper markdown code blocks using triple backticks with the language tag (e.g., \`\`\`tsx ... \`\`\`).`, 
        },
        {
          role: "user",
          content: body.prompt,
        },
      ],
    });

    const aiResponse = response.choices[0].message.content;

    let currentProjectId = body.projectId;

    if (!currentProjectId) {
      const newProject = await Prisma.project.create({
        data: {
          title: body.title || "BugHunter",
          codeContent: body.prompt,
          userId: user.id,
        },
      });
      currentProjectId = newProject.id;
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

    return NextResponse.json({
      success: true,
      projectId: currentProjectId,
      data: response.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}