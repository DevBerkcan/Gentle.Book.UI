import { redirect } from "next/navigation";
import { legalConfig } from "@/lib/config";

export default function AgbPage() {
  redirect(legalConfig.terms);
}
