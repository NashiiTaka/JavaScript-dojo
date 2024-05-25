'use client'

import Sidebar from "@/src/cmp/Sidebar";
import PrelineScript from "@/src/cmp/PrelineScript";
import { RecoilRoot } from 'recoil';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // can get session info on server
  // const session = await getServerSession();

  return (
    <RecoilRoot>
      <Sidebar />
      {children}
      <PrelineScript />
    </RecoilRoot>
  );
}
