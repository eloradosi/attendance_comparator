import { redirect } from "next/navigation";

// Server-side redirect: always send root to `/login` without client-side flash.
export default function Page() {
  redirect("/login");
}
