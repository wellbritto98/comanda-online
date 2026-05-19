import { PublicNavbar } from "@/components/public/PublicNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grain-surface">
      <PublicNavbar />
      {children}
    </div>
  );
}
