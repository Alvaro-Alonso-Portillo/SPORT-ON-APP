"use client";

import SidebarContent from "./sidebar-content";
import { useAuth } from "@/hooks/use-auth";

export default function Sidebar() {
    const { user } = useAuth();

    if (!user) {
        return null;
    }

    return (
        <aside className="hidden md:block w-72 bg-card border-r flex-shrink-0">
           <SidebarContent />
        </aside>
    );
}
