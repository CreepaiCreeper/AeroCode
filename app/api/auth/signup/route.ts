import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import Prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 },
      );
    }

    const existingUser = await Prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User already exists",
        },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

     await Prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    console.log(name);
    console.log(email);
    console.log(password);
    console.log(hashedPassword);

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
      console.error(error);

  return NextResponse.json(
    {
      success: false,
      message: "Internal server error",
    },
    { status: 500 }
  );
  }
}
