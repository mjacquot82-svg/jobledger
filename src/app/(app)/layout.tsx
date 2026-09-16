import { AppNav } from "@/components/nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="pb-20 md:pb-0">
      <AppNav />
      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
    </div>
  );
}
