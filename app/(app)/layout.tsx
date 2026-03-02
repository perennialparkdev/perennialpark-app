import { Navigation } from "@/components/layout/Navigation";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}
