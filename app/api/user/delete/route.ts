import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Prisma from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
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

    // 🌟 User delete hote hi Projects aur Messages bhi cascade se delete ho jayenge
    await Prisma.user.delete({
      where: { id: decoded.id },
    });

    const response = NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Account deletion error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}