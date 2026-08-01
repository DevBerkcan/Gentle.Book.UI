import { redirect } from "next/navigation";
import { legalConfig } from "@/lib/config";

export default function B2bNoticeRedirectPage() {
  redirect(legalConfig.b2b);
}
