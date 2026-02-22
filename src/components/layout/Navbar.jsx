import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, Search, LogOut, User, ChevronDown } from 'lucide-react'

const roleLabels = {
    super_admin: 'Super Admin',
    moderator: 'Safety Moderator',
    health_admin: 'Health Admin',
    cyber_admin: 'Cyber Analyst',
    emergency_coordinator: 'Emergency Coordinator',
}

const roleBadgeColors = {
    super_admin: 'bg-purple-100 text-purple-700',
    moderator: 'bg-blue-100 text-blue-700',
    health_admin: 'bg-green-100 text-green-700',
    cyber_admin: 'bg-orange-100 text-orange-700',
    emergency_coordinator: 'bg-red-100 text-red-700',
}

export default function Navbar({ onMenuClick }) {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [notifOpen, setNotifOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const notifications = [
        { id: 1, text: '3 high-risk scam alerts detected', time: '5m ago', color: 'bg-red-500' },
        { id: 2, text: 'Surge in emergency calls detected', time: '12m ago', color: 'bg-orange-500' },
        { id: 3, text: 'New doctor profile pending approval', time: '1h ago', color: 'bg-blue-500' },
    ]

    return (
        <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
            {/* Left */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="relative hidden md:block">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        placeholder="Search modules…"
                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 w-60"
                    />
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                {/* Notification bell */}
                <div className="relative">
                    <button
                        onClick={() => { setNotifOpen(o => !o); setDropdownOpen(false) }}
                        className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                        <Bell size={20} />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full pulse-dot" />
                    </button>
                    {notifOpen && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50">
                            <p className="text-xs font-semibold text-gray-500 px-2 mb-2">NOTIFICATIONS</p>
                            {notifications.map(n => (
                                <div key={n.id} className="flex items-start gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 cursor-pointer">
                                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${n.color}`} />
                                    <div>
                                        <p className="text-sm text-gray-800">{n.text}</p>
                                        <p className="text-[11px] text-gray-400">{n.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Profile dropdown */}
                <div className="relative">
                    <button
                        onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false) }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            {user?.name?.charAt(0) ?? 'A'}
                        </div>
                        <div className="hidden md:block text-left">
                            <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.name ?? 'Admin'}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleBadgeColors[user?.role] ?? 'bg-gray-100 text-gray-600'}`}>
                                {roleLabels[user?.role] ?? user?.role}
                            </span>
                        </div>
                        <ChevronDown size={14} className="text-gray-400" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                            <button
                                onClick={() => { navigate('/settings'); setDropdownOpen(false) }}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <User size={15} /> Profile & Settings
                            </button>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                            >
                                <LogOut size={15} /> Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    )
}
