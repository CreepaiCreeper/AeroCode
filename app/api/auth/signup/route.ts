import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 },
      );
    }

    const existingUser = await Prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const createUser = await Prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // 1. JWT Token banaya (15 days expiry ke saath)
    const token = jwt.sign(
      { id: createUser.id, email: createUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: "15d" } // 15 din me expire hoga
    );

    // 2. Response object taiyar kiya
    const response = NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
      },
      { status: 201 },
    );

    response.cookies.set("token", token, {
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 24 * 60 * 60, 
      path: "/",
    });

    return response;

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}