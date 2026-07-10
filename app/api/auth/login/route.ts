import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 },
      );
    }
    
    const findUser = await Prisma.user.findUnique({
      where: {
        email,
      },
    });
    
    if (!findUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User does not exist",
        },
        { status: 400 } 
      );
    }

    const isPasswordCorrect = await bcrypt.compare(password, findUser.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        {
          success: false,
          message: "Password does not match",
        },
        { status: 401 } 
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Login successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    );
  }
}