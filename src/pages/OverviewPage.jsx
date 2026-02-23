import { useState, useEffect } from 'react'
import { firestoreService } from '../firebase/firestoreService'
import StatCard from '../components/ui/StatCard'
import {
    Users, Phone, ShieldAlert, Globe, Heart, MapPin,
    Activity, TrendingUp, CheckCircle, Loader2
} from 'lucide-react'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { dateUtils } from '../utils/dateUtils'

const CALL_COLORS = {
    Police: '#3B82F6',
    Ambulance: '#EF4444',
    Fire: '#F97316',
    GBV: '#A855F7',
    Cyber: '#14B8A6',
}

export default function OverviewPage() {
    const [data, setData] = useState({
        usersCount: 0,
        activeToday: 0,
        emergencyCalls: 0,
        scamReports: 0,
        healthSearches: 0,
        serviceRequests: 0,
        threatsBlocked: 0,
        callsTrend: [],
        cyberRisk: [],
        symptoms: [],
        recentEvents: []
    })
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOverviewData = async () => {
            try {
                const results = await Promise.allSettled([
                    firestoreService.getAll('users'),
                    firestoreService.getAll('emergencyCalls'),
                    firestoreService.getAll('scamReports'),
                    firestoreService.getAll('callsTrend'),
                    firestoreService.getAll('cyberRisk'),
                    firestoreService.getAll('symptoms')
                ])

                const [
                    usersRes,
                    callsRes,
                    reportsRes,
                    trendRes,
                    riskRes,
                    symptomsRes
                ] = results

                const users = usersRes.status === 'fulfilled' ? usersRes.value : []
                const emergencyCalls = callsRes.status === 'fulfilled' ? callsRes.value : []
                const scamReports = reportsRes.status === 'fulfilled' ? reportsRes.value : []
                const callsTrend = trendRes.status === 'fulfilled' ? trendRes.value : []
                const cyberRisk = riskRes.status === 'fulfilled' ? riskRes.value : []
                const symptoms = symptomsRes.status === 'fulfilled' ? symptomsRes.value : []

                const combinedEvents = [
                    ...emergencyCalls.map(c => ({
                        id: c.id,
                        type: 'EMERGENCY',
                        category: c.type,
                        timestamp: c.timestamp,
                        icon: '🚨',
                        color: 'bg-red-50 text-red-600',
                        message: `${c.type} call reported by User ${c.userId?.substring(0, 4)}...`
                    })),
                    ...scamReports.map(r => ({
                        id: r.id,
                        type: 'CYBER',
                        category: r.riskLevel,
                        timestamp: r.timestamp,
                        icon: '🛡️',
                        color: r.riskLevel === 'HIGH RISK' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600',
                        message: r.message
                    }))
                ].sort((a, b) => dateUtils.compare(a.timestamp, b.timestamp)).slice(0, 10)

                setData({
                    usersCount: users.length,
                    activeToday: users.filter(u => dateUtils.toISODate(u.lastActive) === new Date().toISOString().split('T')[0]).length,
                    emergencyCalls: emergencyCalls.length,
                    scamReports: scamReports.length,
                    healthSearches: 0,
                    serviceRequests: 0,
                    threatsBlocked: 0,
                    callsTrend,
                    cyberRisk,
                    symptoms,
                    recentEvents: combinedEvents
                })
                setLoading(false)
            } catch (error) {
                console.error('Error fetching overview data:', error)
                setError('Failed to load dashboard data.')
                setLoading(false)
            }
        }
        fetchOverviewData()
    }, [])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
                <p className="text-gray-500 font-medium">Loading real-time safety dashboard...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] bg-red-50 rounded-3xl border border-red-100 p-8">
                <p className="text-red-600 font-bold text-lg">Dashboard Error</p>
                <p className="text-red-500 mt-1">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-200 hover:bg-red-700 transition">
                    Retry Dashboard
                </button>
            </div>
        )
    }
    return (
        <div className="space-y-6 fade-in">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Real-time safety metrics · Sunday, 22 Feb 2026</p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-xl text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                    All Systems Operational
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={data.usersCount.toLocaleString()} change={8.2} icon={Users} color="purple" sub="Registered accounts" />
                <StatCard title="Active Today" value={data.activeToday.toLocaleString()} change={12.5} icon={Activity} color="blue" sub="Unique sessions" />
                <StatCard title="Emergency Calls" value={data.emergencyCalls.toLocaleString()} change={-3.1} icon={Phone} color="red" sub="Today" />
                <StatCard title="Scam Reports" value={data.scamReports.toLocaleString()} change={5.4} icon={Globe} color="orange" sub="Today" />
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Health Searches" value={data.healthSearches.toLocaleString()} change={14.0} icon={Heart} color="green" sub="Today" />
                <StatCard title="Service Requests" value={data.serviceRequests.toLocaleString()} change={6.7} icon={MapPin} color="indigo" sub="Nearby services" />
                <StatCard title="Threats Blocked" value={data.threatsBlocked.toLocaleString()} change={22.1} icon={ShieldAlert} color="purple" sub="All time" />
                <StatCard title="Uptime" value="99.9%" icon={CheckCircle} color="green" sub="Last 30 days" />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Emergency calls trend */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Emergency Calls — Last 7 Days</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={data.callsTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            {Object.entries(CALL_COLORS).map(([key, color]) => (
                                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Cyber risk distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Cyber Threat Risk Distribution</h2>
                    <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                            <Pie data={data.cyberRisk} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {data.cyberRisk.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                        {data.cyberRisk.map(e => (
                            <div key={e.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                                {e.name}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Charts row 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4">Most Searched Health Symptoms</h2>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.symptoms} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                        <YAxis dataKey="symptom" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={130} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" fill="url(#healthGrad)" radius={[0, 6, 6, 0]} />
                        <defs>
                            <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#10B981" />
                                <stop offset="100%" stopColor="#34D399" />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Activity Log */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                        <Activity size={18} className="text-purple-600" />
                        Security Activity Log
                    </h2>
                    <span className="text-xs text-gray-400">Live Feed</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {data.recentEvents.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-gray-400">No recent security activity logged.</div>
                    ) : (
                        data.recentEvents.map(event => (
                            <div key={event.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${event.color}`}>
                                    {event.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{event.type} · {event.category}</p>
                                        <p className="text-[10px] text-gray-400">{dateUtils.format(event.timestamp)}</p>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-0.5 truncate">{event.message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 text-center text-xs font-semibold text-purple-600 hover:text-purple-700 cursor-pointer">
                    View Full Security Audit Trail
                </div>
            </div>
        </div>
    )
}
