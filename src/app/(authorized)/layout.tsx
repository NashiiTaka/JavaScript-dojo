import Sidebar from "@/src/cmp/Sidebar";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // can get session info on server
  // const session = await getServerSession();

  return (
    <>
      <Sidebar />
      {children}
    </>
  );
}
