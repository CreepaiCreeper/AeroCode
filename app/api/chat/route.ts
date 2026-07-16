import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import Prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    // 1. Validation check
    if (!prompt || !prompt.trim()) {
      return NextResponse.json({
        success: false,
        message: "Prompt is required",
      });
    }

    // 2. Cookie se auth token check
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

    let userId = "";

    try {
      // 3. Token verify karo
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

      userId = user.id;
    } catch (tokenError) {
      console.error("JWT Verification Error:", tokenError);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid token",
        },
        { status: 401 },
      );
    }

    const projectTitle =
      prompt.split(" ").slice(0, 5).join(" ") || "New Project";

    // 4. Database Transaction
    const result = await Prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          title: projectTitle,
          userId: userId,
        },
      });

      await tx.message.create({
        data: {
          content: prompt,
          role: "user",
          projectId: project.id,
        },
      });

      return project;
    });

    return NextResponse.json({
      success: true,
      message: "Project and message saved successfully",
      projectId: result.id, 
    });

  } catch (error) {
    console.error("API Error in Save Logic:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";

    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}