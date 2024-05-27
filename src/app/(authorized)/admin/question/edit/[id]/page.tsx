"use client";
import EditQuestion from "@/cmp/EditQuestion";

export default function Page({ params }: { params: { id: string }}) {
  return (
    <EditQuestion params={params} />
  );
}
