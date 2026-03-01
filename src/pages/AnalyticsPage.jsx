import { useState, useEffect } from 'react'
import { db } from '../firebase/config'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { firestoreService } from '../firebase/firestoreService'
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Download, TrendingUp, Loader2 } from 'lucide-react'
import { dateUtils } from '../utils/dateUtils'

const kpis = [
    { label: 'Emergency Response', value: '< 3 sec', target: '< 3 sec', ok: true },
    { label: 'Service Load Time', value: '8.4 sec', target: '< 10 sec', ok: true },
    { label: 'Phishing Detection', value: 'Instant', target: 'Instant', ok: true },
    { label: 'DAU Growth (Monthly)', value: '+12.5%', target: '+10%', ok: true },
]

function buildUserGrowth(users) {
    const map = {}
    users.forEach(u => {
        if (!u.createdAt) return
        const d = dateUtils.toDate(u.createdAt)
        if (isNaN(d.getTime())) return
        const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map)
        .map(([month, users]) => ({ month, users }))
        .sort((a, b) => new Date(a.month) - new Date(b.month))
}

function buildHealthTrend(logs) {
    const map = {}
    // Broad match — catches any health-related actionType the Flutter app records
    logs.filter(l => {
        const t = l.actionType?.toLowerCase() || ''
        return t.includes('health') || t.includes('symptom') || t.includes('medical') || t.includes('first_aid')
    }).forEach(l => {
        if (!l.timestamp) return
        const d = dateUtils.toDate(l.timestamp)
        if (isNaN(d.getTime())) return
        const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map)
        .map(([month, searches]) => ({ month, searches }))
        .sort((a, b) => new Date(a.month) - new Date(b.month))
}

// Normalize service names — Flutter may write 'GBV Support', 'Fire Brigade', etc.
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

/**
 * Groups ALL emergency_calls docs by month — shows complete history.
 */
function buildCallsByMonth(callDocs) {
    const SERVICES = ['Police', 'Fire Brigade', 'GBV', 'Child Support', 'Ambulance']
    const map = {}
    callDocs.forEach(doc => {
        const ts = doc.timestamp?.seconds
            ? new Date(doc.timestamp.seconds * 1000)
            : new Date(doc.timestamp ?? 0)
        if (isNaN(ts.getTime())) return
        const key = ts.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        const service = normalizeService(doc.service || doc.type)
        if (!map[key]) map[key] = { month: key, Police: 0, 'Fire Brigade': 0, GBV: 0, 'Child Support': 0, Ambulance: 0 }
        if (SERVICES.includes(service)) map[key][service]++
    })
    return Object.values(map).sort((a, b) => new Date(a.month) - new Date(b.month))
}

export default function AnalyticsPage() {
    const [users, setUsers] = useState([])
    const [actionLogs, setActionLogs] = useState([])
    const [callDocs, setCallDocs] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let loaded = { users: false, logs: false, calls: false }
        const markDone = (key) => {
            loaded[key] = true
            if (Object.values(loaded).every(Boolean)) setLoading(false)
        }

        // Real-time: users
        const unsubUsers = onSnapshot(
            query(collection(db, 'users')),
            snap => { setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markDone('users') },
            err => { console.error('users:', err); markDone('users') }
        )

        // Real-time: action_logs (all history)
        const unsubLogs = onSnapshot(
            query(collection(db, 'action_logs'), orderBy('timestamp', 'desc')),
            snap => { setActionLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markDone('logs') },
            err => { console.error('action_logs:', err); markDone('logs') }
        )

        // Real-time: emergency_calls
        const unsubCalls = onSnapshot(
            query(collection(db, 'emergency_calls'), orderBy('timestamp', 'desc')),
            snap => { setCallDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))); markDone('calls') },
            err => { console.error('emergency_calls:', err); markDone('calls') }
        )

        return () => { unsubUsers(); unsubLogs(); unsubCalls() }
    }, [])

    // Derived chart data — recomputed on every snapshot change
    const userGrowth = buildUserGrowth(users)
    const healthTrend = buildHealthTrend(actionLogs)
    const callsTrend = buildCallsByMonth(callDocs)

    const exportReport = (label) => alert(`Exporting "${label}" report…`)

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
                <p className="text-gray-500 font-medium">Preparing detailed analytics reports...</p>
            </div>
        )
    }

    const noCallData = callsTrend.length === 0 ||
        callsTrend.every(d =>
            Object.entries(d).filter(([k]) => k !== 'month').every(([, v]) => v === 0)
        )

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports &amp; Analytics</h1>
                <p className="text-sm text-gray-500">Key performance indicators and exportable reports</p>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <div key={k.label} className="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">{k.value}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{k.label}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                            <span className={`w-2 h-2 rounded-full ${k.ok ? 'bg-green-400' : 'bg-red-400'}`} />
                            <span className="text-xs text-gray-400">Target: {k.target}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-800">User Growth</h2>
                        <TrendingUp size={16} className="text-green-500" />
                    </div>
                    {userGrowth.length === 0 ? (
                        <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">No registered users yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={userGrowth}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                                <Line type="monotone" dataKey="users" stroke="#6B46C1" strokeWidth={2.5} dot={{ fill: '#6B46C1', r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Health Feature Usage */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Health Feature Usage</h2>
                    {healthTrend.length === 0 ? (
                        <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">No health activity logged yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={healthTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="searches" fill="url(#healthGrad2)" radius={[6, 6, 0, 0]} />
                                <defs>
                                    <linearGradient id="healthGrad2" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#34D399" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Emergency Calls by Type — All Time */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Emergency Calls by Type — All Time</h2>
                    {noCallData ? (
                        <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">No emergency call data yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={callsTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                                <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Bar dataKey="Police" fill="#3B82F6" stackId="a" />
                                <Bar dataKey="Ambulance" fill="#EF4444" stackId="a" />
                                <Bar dataKey="Fire Brigade" fill="#F97316" stackId="a" />
                                <Bar dataKey="GBV" fill="#A855F7" stackId="a" />
                                <Bar dataKey="Child Support" fill="#14B8A6" stackId="a" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>

            {/* Export buttons */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4">Export Reports</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {['Monthly Emergency Calls', 'Cyber Threat Trends', 'Health Feature Usage', 'User Growth Metrics'].map(label => (
                        <button key={label} onClick={() => exportReport(label)}
                            className="flex items-center gap-2 justify-center px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition">
                            <Download size={14} /> {label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
