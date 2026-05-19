import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { users } from "@/drizzle/schema";
import {
  authCookieOptions,
  COOKIE_NAME,
  signToken,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
        { status: 400 },
      );
    }

    const { email, password } = parsed.data;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "E-mail ou senha incorretos" },
        { status: 401 },
      );
    }

    const token = signToken({
      userId: user.id,
      restaurantId: user.restaurantId,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, authCookieOptions());
    return response;
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
