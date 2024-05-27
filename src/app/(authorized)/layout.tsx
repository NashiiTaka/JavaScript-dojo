'use client'

import Sidebar from "@/cmp/Sidebar";
import PrelineScript from "@/cmp/PrelineScript";
import { RecoilRoot } from 'recoil';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RecoilRoot>
      <div className="flex min-h-screen">
        <Sidebar />
        {children}
      </div>
      <PrelineScript />
    </RecoilRoot>
  );
}
