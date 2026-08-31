import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const businessId = session.user.businessId;
  if (!businessId) {
    redirect("/login");
  }

  return {
    ...session,
    user: {
      ...session.user,
      businessId,
    },
  };
}
