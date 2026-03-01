import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Eye, EyeOff, CircleAlert } from 'lucide-react'

export default function LoginPage() {
    const { login, user, loading } = useAuth()
    const navigate = useNavigate()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPwd, setShowPwd] = useState(false)
    const [error, setError] = useState('')
    const [formLoading, setFormLoading] = useState(false)

    useEffect(() => {
        if (!loading && user) navigate('/overview', { replace: true })
    }, [user, loading, navigate])

    const handleLogin = async (e) => {
        e.preventDefault()
        setError('')
        setFormLoading(true)

        const result = await login(email, password)
        if (result.success) {
            navigate('/overview')
        } else {
            setError(result.error)
            setFormLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FE]">
                <div className="text-purple-600 font-medium">Loading…</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#6B46C1] items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute top-[-60px] right-[-60px] w-72 h-72 bg-white/5 rounded-full" />
                <div className="absolute bottom-[-40px] left-[-40px] w-56 h-56 bg-white/5 rounded-full" />
                <div className="absolute top-1/3 left-1/4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />

                <div className="relative z-10 text-center">
                    <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur mx-auto flex items-center justify-center mb-6 shadow-2xl">
                        <Shield size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-3">My Companion</h1>
                    <p className="text-purple-200 text-lg mb-8">Admin Dashboard</p>
                    <p className="text-purple-300 text-sm italic max-w-xs mx-auto leading-relaxed">
                        "Your comprehensive Safety Solution" — Real-time monitoring, emergency coordination, and cyber threat analysis.
                    </p>

                    <div className="mt-12 grid grid-cols-2 gap-4 text-left">
                        {[
                            { label: 'Active Users', value: '12,480' },
                            { label: 'Calls Today', value: '247' },
                            { label: 'Threats Blocked', value: '1,024' },
                            { label: 'Uptime', value: '99.9%' },
                        ].map(s => (
                            <div key={s.label} className="bg-white/10 rounded-xl p-3">
                                <p className="text-white font-bold text-xl">{s.value}</p>
                                <p className="text-purple-300 text-xs">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#F8F9FE]">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">My Companion</p>
                            <p className="text-xs text-gray-500">Admin Dashboard</p>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
                    <p className="text-gray-500 text-sm mb-8">Sign in to access the admin control center</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@mycompanion.app"
                                required
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm transition"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPwd ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm pr-10 transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-xl text-sm">
                                <CircleAlert size={16} />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-gradient-to-r from-[#6B46C1] to-[#9333EA] text-white font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-lg shadow-purple-200"
                        >
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-700 font-medium mb-1">Demo Credentials</p>
                        <p className="text-xs text-purple-600">Email: <span className="font-mono">admin@mycompanion.app</span></p>
                        <p className="text-xs text-purple-600">Password: <span className="font-mono">admin123</span></p>
                    </div>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        My Companion v1.0 · Secured by Firebase Auth
                    </p>
                </div>
            </div>
        </div>
    )
}
