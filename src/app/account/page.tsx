import { redirect } from "next/navigation";
import { AccountClient } from "~/components/account/AccountClient";
import { auth } from "~/server/auth";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  return (
    <AccountClient
      user={{
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: session.user.role ?? "CUSTOMER",
        emailVerified: session.user.emailVerified,
        phone: session.user.phone ?? "",
      }}
    />
  );
}
