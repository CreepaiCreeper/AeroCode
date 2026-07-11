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
    const reponse =  await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: "You are BugHunter, an elite debugging assistant for AeroCode. Analyze the code provided by the user, find bugs/errors, and provide a clear explanation with headings, bullet points, and emojis. Always provide the 100% corrected code inside proper markdown code blocks.",
        },
        {
          role: "user",
          content: body.prompt,
        },
      ],
    });
    return NextResponse.json({
  success: true,
  data: reponse.choices[0].message.content
});
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 401 },
    );
  }
}
