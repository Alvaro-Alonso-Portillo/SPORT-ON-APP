
"use client";

import SidebarContent from "./sidebar-content";

export default function Sidebar() {
    return (
        <aside className="hidden md:block w-72 bg-card border-r flex-shrink-0">
           <SidebarContent />
        </aside>
    );
}
