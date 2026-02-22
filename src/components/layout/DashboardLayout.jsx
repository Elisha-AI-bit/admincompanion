import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function DashboardLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8F9FE]">
            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Mobile overlay */}
            {!sidebarOpen ? null : (
                <div
                    className="fixed inset-0 bg-black/30 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'ml-0'}`}>
                <Navbar onMenuClick={() => setSidebarOpen(s => !s)} />
                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
