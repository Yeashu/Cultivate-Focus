import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/mongodb";
import { UserModel } from "@/models/user";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      {
        message:
          "Email and password are required. Password must be at least 6 characters long.",
      },
      { status: 400 }
    );
  }

  await connectToDatabase();

  const existing = await UserModel.findOne({ email });

  if (existing) {
    return NextResponse.json(
      { message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hash(password, 12);

  const user = await UserModel.create({
    email,
    passwordHash,
    name: name || undefined,
  });

  return NextResponse.json(
    {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name ?? undefined,
      },
    },
    { status: 201 }
  );
}
