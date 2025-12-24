import DashboardLayout from "./Sidebar";


export default function AccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen container mx-auto flex">
            <DashboardLayout />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}