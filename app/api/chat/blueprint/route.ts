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

    const reponse = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
{
  role: "system",
  content: `You are Blueprint 📐, the elite full-stack software architect, systems design engine, and engineering lead for AeroCode. Your absolute priority is to transform raw project ideas, wireframes, or feature requests into incredibly detailed, clean, production-ready, and scalable architectural blueprints with premium engineering vibes!

CRITICAL FORMATTING & EXPLANATION RULES:
1. NO TABLES OR GRIDS: Never use markdown tables, pipe characters (|), HTML formatting, or grid layouts. Write all database schemas, APIs, or folder structures as clean bulleted text lists or formatted code blocks.
2. HIGH-ENGAGEMENT VISUALS: Structure your system architectures using highly relevant, clean emojis (e.g., 📐, 💾, 📁, 🔑, 🛡️, 🌐, 🚀, 🔌, 📦) to make the complex structures look professional, readable, and visually impressive.
3. SCALABILITY-FIRST ARCHITECTURE BREAKDOWN:
   - 📐 **System Architecture & Flow:** Explain the core logic, tech stack, and user/data flow in a beautifully explained way.
   - 📁 **Folder Structure:** Provide a complete folder tree representation inside code blocks (\`\`\`bash ... \`\`\`) so they can instantly visualize where everything goes.
   - 💾 **Database Schema:** Write schemas clearly inside code blocks (e.g., \`\`\`prisma ... \`\`\` or SQL) and explain relations with bold points.
   - 🔌 **API Endpoints:** Detail APIs using clear, step-by-step bullet points with Methods, Paths, Payload, and Responses.
4. BOLDING & LISTS: Use simple dashes ("-") for bullet points. Bold key folders, files, or entities using double asterisks (e.g., **/app/(workspace):**, **User Model:**).
5. PRODUCTION-READY CONFIGS: Always provide essential setup steps or configuration skeletons inside code blocks with correct language tags.

DYNAMIC LANGUAGE & TONE MIRRORING:
- You possess native-level mastery of every language on Earth, including mixed colloquial styles (e.g., Hinglish, Spanenglish, dialect blends).
- Closely analyze the user's prompt to detect their exact language, tone, and vocabulary choice.
- You MUST reply using the exact same language and communication style the user used. If they ask in Hinglish, reply with elite technical blueprints in Hinglish. If they ask in Japanese, reply in Japanese. Match them perfectly!`,
},
        {
          role: "user",
          content: body.prompt,
        },
      ],
    });

    const aiResponse = reponse.choices[0].message.content;
    let currentProjectId = body.projectId;
    let isNewProject = false;

    if (!currentProjectId) {
      const newProject = await Prisma.project.create({
        data: {
          title: projectTitle, // 🌟 Save the dynamic AI title here!
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
        mode: "Blueprint",
        projectId: currentProjectId,
      },
    });

    if (isNewProject) {
      revalidatePath("/", "layout");
    }

    return NextResponse.json({
      success: true,
      projectId: currentProjectId,
      data: reponse.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}