import { redirect } from "next/navigation";
import { legalConfig } from "@/lib/config";

export default function DatenschutzPage() {
  redirect(legalConfig.privacy);
}
