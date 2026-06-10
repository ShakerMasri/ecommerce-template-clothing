import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { validateSameOriginRequest } from "~/lib/csrf";
import { prisma } from "~/lib/prisma";
import { rateLimit } from "~/lib/rate-limit";
import { updateProfileSchema } from "~/lib/validations";
import { auth } from "~/server/auth";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { message: "You must be logged in." },
      { status: 401 },
    );
  }

  const csrfResponse = validateSameOriginRequest(request);

  if (csrfResponse) {
    return csrfResponse;
  }

  const userId = session.user.id;

  const limited = await rateLimit(request, "profileUpdate", userId);

  if (!limited.ok) {
    return limited.response;
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid profile data.",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { name, phone } = parsed.data;

  try {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name,
        phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        phone: true,
        role: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { message: "Your account could not be found." },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { message: "Failed to update profile." },
      { status: 500 },
    );
  }
}
