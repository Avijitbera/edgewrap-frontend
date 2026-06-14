import type { Metadata } from "next";
import MembersClient from "./members-client";

export const metadata: Metadata = { title: "Members & Team — EdgeWrap" };

export default function MembersPage() {
  return <MembersClient />;
}
