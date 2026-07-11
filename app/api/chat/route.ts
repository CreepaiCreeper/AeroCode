import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import Prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { prompt } = body;


  if (!prompt || !prompt.trim()) {
    return NextResponse.json({
      success: false,
      message: "Prompt is required",
    });
  }

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
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        success: false,
        message: "Invalid token",
      },
      { status: 401 },
    );
  }
  return NextResponse.json({
    success: true,
    message: "Prompt received",
  });
}
