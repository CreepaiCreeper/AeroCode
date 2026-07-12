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
          content:
            "You are Blueprint, an elite software architect assistant for AeroCode. Your task is to take a project idea from the user and generate a detailed project blueprint, including database schema recommendations, system architecture, folder structure, and step-by-step implementation steps. Format your response beautifully using Markdown, headings, bullet points, and emojis.",
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
    data:{
        role:"assistant",
        content: aiResponse || "",
        mode: "Blueprint",
        projectId: currentProjectId
    }
   })

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
