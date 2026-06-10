import { cache } from "react";
import { headers } from "next/headers";
import { type Role } from "@prisma/client";
import { auth as betterAuth } from "~/lib/auth";

type AppSession = {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string | null;
    phone?: string | null;
    role: Role;
  };
  session: {
    id: string;
    token: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

function normalizeRole(role: string | undefined): Role {
  return role === "ADMIN" ? "ADMIN" : "CUSTOMER";
}

const uncachedAuth = async (): Promise<AppSession | null> => {
  const session = await betterAuth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  const user = session.user as typeof session.user & {
    role?: string;
    phone?: string | null;
    emailVerified?: boolean;
    image?: string | null;
  };

  return {
    session: session.session,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      image: user.image,
      phone: user.phone,
      role: normalizeRole(user.role),
    },
  };
};

export const auth = cache(uncachedAuth);
