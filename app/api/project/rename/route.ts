import Prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function PATCH(request: NextRequest) {
  const token = request.cookies.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { projectId, newTitle } = body;

    if (!projectId || !newTitle || !newTitle.trim()) {
      return NextResponse.json(
        { success: false, message: "Project ID and new title are required" },
        { status: 400 },
      );
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!);
    const payload = decoded as { id: string; email: string };

    await Prisma.project.update({
      where: {
        id: projectId,
        userId: payload.id,
      },
      data: {
        title: newTitle.trim(),
      },
    });

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      message: "Project renamed successfully!",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}