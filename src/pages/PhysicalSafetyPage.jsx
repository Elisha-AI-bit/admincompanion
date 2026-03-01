import { useState, useEffect } from 'react'
import { firestoreService } from '../firebase/firestoreService'
import { db } from '../firebase/config'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { ShieldAlert, Edit2, Save, X, Radio, MapPin, Video, Loader2, Phone } from 'lucide-react'
import { dateUtils } from '../utils/dateUtils'

function todayStart() {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
}

export default function PhysicalSafetyPage() {
    const [hotlines, setHotlines] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editVal, setEditVal] = useState('')
    const [error, setError] = useState(null)
    const [recentLogs, setRecentLogs] = useState([])
    const [usersMap, setUsersMap] = useState({})   // userId → name
    const [stats, setStats] = useState({
        recordings: 0,
        locationShares: 0,
        sosAlerts: 0,
        emergencyCallsToday: 0,
    })

    // Hotlines listener
    useEffect(() => {
        const unsubscribe = firestoreService.subscribe('hotlines',
            (data) => { setHotlines(data || []); setLoading(false); setError(null) },
            (err) => { console.error('Error:', err); setError('Failed to load hotlines.'); setLoading(false) }
        )
        return () => unsubscribe()
    }, [])

    // Live action_logs listener for stats + recent activity (all history)
    useEffect(() => {
        const logsQuery = query(
            collection(db, 'action_logs'),
            orderBy('timestamp', 'desc')
        )
        const unsub = onSnapshot(logsQuery, (snap) => {
            const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            const todayStr = new Date().toISOString().split('T')[0]

            const recordings = logs.filter(l => l.actionType === 'recording_started').length
            const locationShares = logs.filter(l => l.actionType === 'location_share').length
            const sosAlerts = logs.filter(l => l.actionType === 'sos').length
            const emergencyCallsToday = logs.filter(l => {
                if (!l.actionType?.startsWith('emergency_call_')) return false
                const ts = l.timestamp?.seconds
                    ? new Date(l.timestamp.seconds * 1000)
                    : new Date(l.timestamp ?? 0)
                return ts.toISOString().split('T')[0] === todayStr
            }).length

            setStats({ recordings, locationShares, sosAlerts, emergencyCallsToday })

            // Recent logs: SOS, emergency calls, recordings, location shares
            const relevant = logs.filter(l =>
                ['sos', 'recording_started', 'location_share'].includes(l.actionType) ||
                l.actionType?.startsWith('emergency_call_')
            ).slice(0, 20)
            setRecentLogs(relevant)
        }, (err) => console.error('Action log error:', err))

        return () => unsub()
    }, [])

    // Real-time users map for name resolution
    useEffect(() => {
        const unsubUsers = onSnapshot(
            query(collection(db, 'users')),
            snap => {
                const map = {}
                snap.docs.forEach(d => {
                    const u = d.data()
                    map[d.id] = u.name || u.displayName || u.email || d.id
                })
                setUsersMap(map)
            },
            err => console.error('users snapshot error:', err)
        )
        return () => unsubUsers()
    }, [])

    const startEdit = (id, number) => { setEditingId(id); setEditVal(number) }
    const saveEdit = async (id) => {
        try {
            await firestoreService.update('hotlines', id, { number: editVal })
            setEditingId(null)
        } catch (err) {
            console.error('Error saving hotline:', err)
        }
    }

    const statCards = [
        { label: 'Active Recordings', value: stats.recordings, icon: Video, color: 'from-purple-500 to-indigo-600' },
        { label: 'Location Shares', value: stats.locationShares, icon: MapPin, color: 'from-blue-500 to-cyan-500' },
        { label: 'SOS Activations', value: stats.sosAlerts, icon: Radio, color: 'from-red-500 to-orange-500' },
        { label: 'Emergency Calls Today', value: stats.emergencyCallsToday, icon: ShieldAlert, color: 'from-pink-500 to-rose-500' },
    ]

    const actionLabel = (type) => {
        const map = {
            sos: 'SOS Alert',
            recording_started: 'Recording Started',
            location_share: 'Location Shared',
            emergency_call_police: 'Police Call',
            emergency_call_gbv: 'GBV Call',
            emergency_call_fire: 'Fire Call',
            emergency_call_child_support: 'Child Support Call',
        }
        return map[type] || type
    }
    const actionIcon = (type) => {
        const map = {
            sos: '🚨', recording_started: '🎙️', location_share: '📍',
            emergency_call_police: '🚔', emergency_call_gbv: '💜',
            emergency_call_fire: '🚒', emergency_call_child_support: '👶',
        }
        return map[type] || '⚡'
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Physical Safety Module</h1>
                <p className="text-sm text-gray-500">Monitor recordings, location shares, and manage hotlines</p>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(s => (
                    <div key={s.label} className="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                            <s.icon size={18} className="text-white" />
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                        <p className="text-sm text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Hotlines management */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Emergency Hotlines</h2>
                    <span className="text-xs text-gray-400">Super Admin only</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <Loader2 className="animate-spin text-purple-600 mb-2" size={24} />
                            <p className="text-sm text-gray-500">Loading hotlines...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-10 bg-red-50">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    ) : hotlines.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10">
                            <p className="text-sm text-gray-500 font-medium">No hotlines configured yet.</p>
                        </div>
                    ) : (
                        hotlines.map(h => (
                            <div key={h.id} className="px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{h.icon}</span>
                                    <p className="font-medium text-gray-800">{h.service}</p>
                                </div>
                                {editingId === h.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            value={editVal}
                                            onChange={e => setEditVal(e.target.value)}
                                            className="border border-purple-300 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-purple-300"
                                        />
                                        <button onClick={() => saveEdit(h.id)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
                                            <Save size={15} />
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200">
                                            <X size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <span className="font-mono font-semibold text-gray-700 text-sm">{h.number}</span>
                                        <button onClick={() => startEdit(h.id, h.number)} className="p-1.5 hover:bg-purple-50 text-gray-400 hover:text-purple-600 rounded-lg transition">
                                            <Edit2 size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Recent Safety Activity (from action_logs) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Recent Safety Activity</h2>
                {recentLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <p className="text-3xl mb-2">🛡️</p>
                        <p className="text-sm text-gray-400">No safety events recorded yet</p>
                        <p className="text-xs text-gray-400 mt-1">SOS alerts, recordings and location shares will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentLogs.map((log) => (
                            <div key={log.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-rose-500 text-white flex items-center justify-center text-base">
                                        {actionIcon(log.actionType)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">
                                            {log.userName || usersMap[log.userId] || log.userId?.substring(0, 10) || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {dateUtils.format(log.timestamp)}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-purple-100 text-purple-700">
                                    {actionLabel(log.actionType)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
