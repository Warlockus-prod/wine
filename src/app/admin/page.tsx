import { redirect } from "next/navigation";

export default function AdminRedirectPage() {
  redirect("/v1/admin");
}
