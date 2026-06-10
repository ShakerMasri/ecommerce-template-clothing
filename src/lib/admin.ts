import "server-only";

import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json({ message: "Not found." }, { status: 404 }),
    };
  }
  return {
    ok: true as const,
    user: {
      id: session.user.id,
      role: session.user.role,
    },
  };
}

export async function requireAdminPage(callbackUrl = "/admin") {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return session;
}
