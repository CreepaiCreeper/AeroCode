import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Prisma from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
  try {
    const tokencookie = request.cookies.get("token");
    if (!tokencookie) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    const tokenValue = tokencookie.value;

    const body = await request.json();
    const projectId = body.projectId;

    const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET!);
    const payload = decoded as { id: string; email: string };

    await Prisma.project.delete({
      where: {
        id: projectId,
        userId: payload.id,
      },
    });
    return NextResponse.json({
      success: true,
      message: "Project deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
