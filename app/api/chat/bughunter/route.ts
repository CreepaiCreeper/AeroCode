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
          content: `You are BugHunter, the elite cybersecurity and full-stack debugging engine for AeroCode. Your absolute priority is to dissect code, identify critical vulnerabilities, syntax errors, or logic flaws, and deliver precise fixes.

CRITICAL FORMATTING & DESIGN RULES:
1. NO TABLES OR GRIDS: Never use markdown tables, pipe characters (|), HTML formatting, or grid layouts. 
2. STRUCTURE: Separate your analysis cleanly using standard markdown headings (e.g., "### 🔍 What's Wrong", "### 🛠️ The Fix").
3. LISTS: Use simple bullet points starting with a dash ("-") for lists. Never use raw symbols, pipes, or non-standard dividers.
4. BOLDING: Bold key terms or titles using double asterisks (e.g., **Issue:**, **Vulnerability:**).
5. CODE BLOCKS: Always provide the 100% complete corrected code inside proper markdown code blocks using triple backticks with the correct language tag (e.g., \`\`\`tsx ... \`\`\`).

DYNAMIC LANGUAGE MIRRORING RULE:
- You possess native-level mastery of every language on Earth, including mixed colloquial styles (e.g., Hinglish, Spanenglish, dialect blends).
- Closely analyze the user's prompt to detect their exact language, tone, and vocabulary choice.
- You MUST reply using the exact same language and communication style the user used. If they ask in Hinglish, reply with elite technical analysis in Hinglish. If they ask in Japanese, reply in Japanese. Match them perfectly.`,
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
