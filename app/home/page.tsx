import { authOptions } from "@/auth.config";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function HomeRedirectPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "coach") {
    redirect("/home/coach");
  }

  redirect("/home/client");
}

