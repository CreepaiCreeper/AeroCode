import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Prisma from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get("token");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as {
      id: string;
      email: string;
    };

    const body = await request.json();
    const { name, image } = body;

    if (name !== undefined && !name.trim()) {
      return NextResponse.json(
        { success: false, message: "Username cannot be empty" },
        { status: 400 },
      );
    }

    const updatedUser = await Prisma.user.update({
      where: { id: decoded.id },
      data: {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(image !== undefined ? { image } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        name: updatedUser.name,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}