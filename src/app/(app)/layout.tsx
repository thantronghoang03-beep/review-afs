import { AuthGuard } from "@/components/layout/AuthGuard";
import { CompanyProvider } from "@/lib/context/CompanyContext";
import { NotificationsProvider } from "@/lib/context/NotificationsContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <CompanyProvider>
        <NotificationsProvider>
          <div className="flex h-full min-h-screen bg-zinc-50">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
          </div>
        </NotificationsProvider>
      </CompanyProvider>
    </AuthGuard>
  );
}
