"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/invoices", label: "Invoices" },
  { href: "/customers", label: "Customers" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur">
        <Link href="/dashboard" className="font-semibold">
          JobLedger
        </Link>
        <Link className="text-sm text-stone-600" href="/settings">
          Settings
        </Link>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-4">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`block py-3 text-center text-xs ${active ? "font-semibold text-amber-800" : "text-stone-600"}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <nav className="hidden border-b border-stone-200 px-4 py-2 md:block">
        <ul className="flex gap-4">
          {items.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`text-sm ${active ? "font-semibold text-amber-800" : "text-stone-600"}`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
