import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    LayoutDashboard, Users, Phone, ShieldAlert, Globe, Heart,
    MapPin, Newspaper, BarChart2, Settings, ChevronLeft,
    ChevronRight, Shield
} from 'lucide-react'

const navItems = [
    { to: '/overview', icon: LayoutDashboard, label: 'Overview' },
    { to: '/users', icon: Users, label: 'Users' },
    { to: '/emergency-calls', icon: Phone, label: 'Emergency Calls' },
    { to: '/physical-safety', icon: ShieldAlert, label: 'Physical Safety' },
    { to: '/cyber-safety', icon: Globe, label: 'Cyber Safety' },
    { to: '/health', icon: Heart, label: 'Health Management' },
    { to: '/nearby-services', icon: MapPin, label: 'Nearby Services' },
    { to: '/news', icon: Newspaper, label: 'News & Content' },
    { to: '/analytics', icon: BarChart2, label: 'Reports & Analytics' },
    { to: '/device-locator', icon: MapPin, label: 'Device Locator' },
    { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar({ open, onClose }) {
    return (
        <>
            {/* Desktop sidebar */}
            <aside className={`
        fixed top-0 left-0 h-full z-30 flex flex-col
        bg-gradient-to-b from-[#1E1B4B] to-[#312E81]
        transition-all duration-300 overflow-hidden
        ${open ? 'w-64' : 'w-0 lg:w-16'}
        shadow-2xl
      `}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 min-w-[4rem]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#9333EA] to-[#6B46C1] flex items-center justify-center flex-shrink-0">
                        <Shield size={18} className="text-white" />
                    </div>
                    {open && (
                        <div className="overflow-hidden">
                            <p className="text-white font-bold text-sm leading-tight whitespace-nowrap">My Companion</p>
                            <p className="text-purple-300 text-[10px] whitespace-nowrap">Admin Dashboard</p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-200 group
                ${isActive
                                    ? 'bg-white/15 text-white shadow-inner'
                                    : 'text-purple-200 hover:bg-white/10 hover:text-white'}
              `}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {open && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Tagline */}
                {open && (
                    <div className="px-4 py-4 border-t border-white/10">
                        <p className="text-purple-400 text-[10px] text-center italic">
                            "Your comprehensive Safety Solution"
                        </p>
                    </div>
                )}
            </aside>
        </>
    )
}
