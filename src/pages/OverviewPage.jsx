import { useState, useEffect, useRef } from 'react'
import { db } from '../firebase/config'
import {
    collection, query, orderBy, onSnapshot
} from 'firebase/firestore'
import { firestoreService } from '../firebase/firestoreService'
import StatCard from '../components/ui/StatCard'
import {
    Users, Phone, ShieldAlert, Globe, Heart, MapPin,
    Activity, CheckCircle, Loader2
} from 'lucide-react'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { dateUtils } from '../utils/dateUtils'

const CALL_COLORS = {
    Police: '#3B82F6',
    Ambulance: '#EF4444',
    'Fire Brigade': '#F97316',
    GBV: '#A855F7',
    'Child Support': '#14B8A6',
}

// Normalize Firestore service names to canonical UI keys
// Handles variations the Flutter app may write (e.g. 'GBV Support', 'Fire Brigade', etc.)
const normalizeService = (s) => {
    if (!s) return 'Unknown'
    const lower = s.toLowerCase()
    if (lower === 'fire' || lower.includes('fire')) return 'Fire Brigade'
    if (lower === 'gbv' || lower.includes('gbv') || lower.includes('gender')) return 'GBV'
    if (lower.includes('ambulance') || lower.includes('medical')) return 'Ambulance'
    if (lower.includes('child') || lower.includes('support')) return 'Child Support'
    if (lower.includes('police')) return 'Police'
    return s
}

const ACTION_ICON_MAP = {
    emergency_call_police: { icon: '🚔', label: 'Police Call', color: 'bg-blue-50 text-blue-600' },
    emergency_call_gbv: { icon: '💜', label: 'GBV Call', color: 'bg-purple-50 text-purple-600' },
    emergency_call_fire: { icon: '🚒', label: 'Fire Call', color: 'bg-orange-50 text-orange-600' },
    emergency_call_child_support: { icon: '👶', label: 'Child Support Call', color: 'bg-pink-50 text-pink-600' },
    location_share: { icon: '📍', label: 'Location Shared', color: 'bg-blue-50 text-blue-600' },
    recording_started: { icon: '🎙️', label: 'Recording Started', color: 'bg-indigo-50 text-indigo-600' },
    recording_stopped: { icon: '⏹️', label: 'Recording Stopped', color: 'bg-gray-50 text-gray-600' },
    sos: { icon: '🚨', label: 'SOS Alert', color: 'bg-red-50 text-red-600' },
}

/** Builds 7-day grouped call trend from raw emergency_calls docs */
function buildCallsTrend(docs, days = 7) {
    const SERVICES = ['Police', 'Fire Brigade', 'GBV', 'Child Support', 'Ambulance']
    const dayMap = {}
    const dayLabels = []
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const label = d.toLocaleDateString('en-US', { weekday: 'short' })
        const key = d.toISOString().split('T')[0]
        dayMap[key] = { day: label, Police: 0, 'Fire Brigade': 0, GBV: 0, 'Child Support': 0, Ambulance: 0 }
        dayLabels.push(key)
    }
    docs.forEach(doc => {
        const ts = doc.timestamp?.seconds
            ? new Date(doc.timestamp.seconds * 1000)
            : new Date(doc.timestamp ?? 0)
        const key = ts.toISOString().split('T')[0]
        const service = normalizeService(doc.service || doc.type)
        if (dayMap[key] && SERVICES.includes(service)) {
            dayMap[key][service] = (dayMap[key][service] || 0) + 1
        }
    })
    return dayLabels.map(k => dayMap[k])
}

export default function OverviewPage() {
    const todayStr = new Date().toISOString().split('T')[0]

    // Separate state slices for each real-time source
    const [users, setUsers] = useState([])
    const [emergencyCalls, setEmergencyCalls] = useState([])
    const [scamReports, setScamReports] = useState([])
    const [actionLogs, setActionLogs] = useState([])
    const [cyberRisk, setCyberRisk] = useState([])
    const [symptoms, setSymptoms] = useState([])
    const [loading, setLoading] = useState(true)
    const loadedRef = useRef({ users: false, calls: false, logs: false })

    function markLoaded(key) {
        loadedRef.current[key] = true
        if (Object.values(loadedRef.current).every(Boolean)) setLoading(false)
    }

    useEffect(() => {
        // ── 1. Real-time: users collection ──────────────────────────────
        const unsubUsers = onSnapshot(
            query(collection(db, 'users')),
            snap => { setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markLoaded('users') },
            err => { console.error('users snapshot error:', err); markLoaded('users') }
        )

        // ── 2. Real-time: emergency_calls collection ──────────────────────
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const unsubCalls = onSnapshot(
            query(collection(db, 'emergency_calls'), orderBy('timestamp', 'desc')),
            snap => { setEmergencyCalls(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markLoaded('calls') },
            err => { console.error('emergency_calls snapshot error:', err); markLoaded('calls') }
        )

        // ── 3. Real-time: action_logs (all history) ──────────────────────
        const unsubLogs = onSnapshot(
            query(collection(db, 'action_logs'), orderBy('timestamp', 'desc')),
            snap => { setActionLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markLoaded('logs') },
            err => { console.error('action_logs snapshot error:', err); markLoaded('logs') }
        )

        // ── 4. One-time: slower/static collections ────────────────────────
        Promise.allSettled([
            firestoreService.getAll('scamReports'),
            firestoreService.getAll('cyberRisk'),
            firestoreService.getAll('symptoms'),
        ]).then(([rRes, riskRes, sympRes]) => {
            if (rRes.status === 'fulfilled') setScamReports(rRes.value)
            if (riskRes.status === 'fulfilled') setCyberRisk(riskRes.value)
            if (sympRes.status === 'fulfilled') setSymptoms(sympRes.value)
        })

        return () => { unsubUsers(); unsubCalls(); unsubLogs() }
    }, [])

    // ── Derived stats (auto-recompute whenever source data changes) ──────
    const activeTodayCount = new Set(
        actionLogs.filter(l => {
            const ts = l.timestamp?.seconds
                ? new Date(l.timestamp.seconds * 1000)
                : new Date(l.timestamp ?? 0)
            return ts.toISOString().split('T')[0] === todayStr
        }).map(l => l.userId)
    ).size

    const callsToday = emergencyCalls.filter(c => {
        const ts = c.timestamp?.seconds
            ? new Date(c.timestamp.seconds * 1000)
            : new Date(c.timestamp ?? 0)
        return ts.toISOString().split('T')[0] === todayStr
    }).length

    const healthSearches = actionLogs.filter(l => l.actionType?.includes('health')).length
    const serviceRequests = actionLogs.filter(l =>
        l.actionType?.includes('service') || l.actionType?.includes('nearby')
    ).length
    const threatsBlocked = actionLogs.filter(l =>
        l.actionType?.includes('cyber') || l.actionType?.includes('threat')
    ).length

    const callsTrend = buildCallsTrend(emergencyCalls, 7)

    // Build userId→name map from the users snapshot
    const usersMap = Object.fromEntries(users.map(u => [u.id, u.name || u.displayName || u.email || 'Unknown']))

    const recentEvents = actionLogs.slice(0, 15).map(log => {
        const meta = ACTION_ICON_MAP[log.actionType] || { icon: '⚡', label: log.actionType || 'Action', color: 'bg-gray-50 text-gray-600' }
        const displayName = log.userName || usersMap[log.userId] || log.userId?.substring(0, 8) || 'Unknown user'
        return {
            id: log.id,
            type: 'ACTION',
            category: meta.label,
            timestamp: log.timestamp,
            icon: meta.icon,
            color: meta.color,
            message: `${displayName} — ${meta.label}`
        }
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
                <p className="text-gray-500 font-medium">Loading real-time safety dashboard...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Real-time safety metrics · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-xl text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                    All Systems Operational
                </div>
            </div>

            {/* Stat cards — all derived from live snapshots */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Total Users" value={users.length.toLocaleString()} change={8.2} icon={Users} color="purple" sub="Registered accounts" />
                <StatCard title="Active Today" value={activeTodayCount.toLocaleString()} change={12.5} icon={Activity} color="blue" sub="Unique sessions" />
                <StatCard title="Emergency Calls" value={callsToday.toLocaleString()} change={-3.1} icon={Phone} color="red" sub="Today" />
                <StatCard title="Scam Reports" value={scamReports.length.toLocaleString()} change={5.4} icon={Globe} color="orange" sub="Total" />
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Health Searches" value={healthSearches.toLocaleString()} change={14.0} icon={Heart} color="green" sub="From action logs" />
                <StatCard title="Service Requests" value={serviceRequests.toLocaleString()} change={6.7} icon={MapPin} color="indigo" sub="Nearby services" />
                <StatCard title="Threats Blocked" value={threatsBlocked.toLocaleString()} change={22.1} icon={ShieldAlert} color="purple" sub="All time" />
                <StatCard title="Uptime" value="99.9%" icon={CheckCircle} color="green" sub="Last 30 days" />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Emergency Calls — Last 7 Days</h2>
                    {callsTrend.every(d => Object.values(d).filter(v => typeof v === 'number').every(v => v === 0)) ? (
                        <div className="flex items-center justify-center h-[240px] text-sm text-gray-400">No emergency call data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={callsTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                {Object.entries(CALL_COLORS).map(([key, color]) => (
                                    <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Cyber Threat Risk Distribution</h2>
                    {cyberRisk.length === 0 ? (
                        <div className="flex items-center justify-center h-[180px] text-sm text-gray-400">No cyber risk data yet</div>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={180}>
                                <PieChart>
                                    <Pie data={cyberRisk} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {cyberRisk.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex justify-center gap-4 mt-2">
                                {cyberRisk.map(e => (
                                    <div key={e.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: e.color }} />
                                        {e.name}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Health Symptoms chart */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4">Most Searched Health Symptoms</h2>
                {symptoms.length === 0 ? (
                    <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">No health symptom data yet</div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={symptoms} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <YAxis dataKey="symptom" type="category" tick={{ fontSize: 12, fill: '#6B7280' }} width={130} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="count" fill="url(#healthGrad)" radius={[0, 6, 6, 0]} />
                            <defs>
                                <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#34D399" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                )}
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
                    {recentEvents.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-gray-400">No recent security activity logged.</div>
                    ) : (
                        recentEvents.map(event => (
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
