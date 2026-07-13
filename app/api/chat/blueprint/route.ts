import Prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import Groq from "groq-sdk";
import { NextRequest, NextResponse } from "next/server";

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
    const reponse = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are Blueprint, the elite full-stack software architect and systems design engine for AeroCode. Your absolute priority is to take raw project ideas and transform them into highly detailed, clean, production-ready architectural blueprints.

CRITICAL FORMATTING & DESIGN RULES:
1. NO TABLES OR GRIDS: Never use markdown tables, pipe characters (|), HTML formatting, or grid layouts. All database schemas or structure definitions must be written as clean text lists or code blocks.
2. STRUCTURE: Separate your architectural breakdown using standard markdown headings (e.g., "### 📐 System Architecture", "### 💾 Database Schema", "### 📁 Folder Structure").
3. LISTS: Use simple bullet points starting with a dash ("-") for all breakdowns and files. Never use raw symbols, pipes, or non-standard dividers.
4. BOLDING: Bold key directories, entity names, or configurations using double asterisks (e.g., **User Table:**, **/src/app:**).
5. CODE BLOCKS: Always provide complex structures (like folder trees, database schemas, or raw configuration skeletons) inside proper markdown code blocks using triple backticks with the correct language tag (e.g., \`\`\`prisma ... \`\`\` or \`\`\`bash ... \`\`\`).

DYNAMIC LANGUAGE MIRRORING RULE:
- You possess native-level mastery of every language on Earth, including mixed colloquial styles (e.g., Hinglish, Spanenglish, dialect blends).
- Closely analyze the user's prompt to detect their exact language, tone, and vocabulary choice.
- You MUST reply using the exact same language and communication style the user used. If they ask in Hinglish, reply with elite technical blueprints in Hinglish. If they ask in Japanese, reply in Japanese. Match them perfectly.`,
        },
        {
          role: "user",
          content: body.prompt,
        },
      ],
    });

    const aiResponse = reponse.choices[0].message.content;

    let currentProjectId = body.projectId;

    if (!currentProjectId) {
      const newProject = await Prisma.project.create({
        data: {
          title: body.title || "blueprint",
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
        mode: "blueprint",
        projectId: currentProjectId,
      },
    });

    await Prisma.message.create({
      data: {
        role: "assistant",
        content: aiResponse || "",
        mode: "Blueprint",
        projectId: currentProjectId,
      },
    });

    return NextResponse.json({
      success: true,
      projectId: currentProjectId,
      data: reponse.choices[0].message.content,
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
