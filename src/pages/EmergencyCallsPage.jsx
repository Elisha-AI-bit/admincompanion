import { useState, useEffect } from 'react'
import { firestoreService } from '../firebase/firestoreService'
import { db } from '../firebase/config'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { Phone, Filter, Download, Loader2 } from 'lucide-react'
import { dateUtils } from '../utils/dateUtils'

const typeColors = {
    Police: 'bg-blue-100 text-blue-700',
    Ambulance: 'bg-red-100 text-red-700',
    'Fire Brigade': 'bg-orange-100 text-orange-700',
    GBV: 'bg-purple-100 text-purple-700',
    'Child Support': 'bg-teal-100 text-teal-700',
}

const typeIcons = { Police: '🚔', Ambulance: '🚑', 'Fire Brigade': '🚒', GBV: '💜', 'Child Support': '👶' }

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

export default function EmergencyCallsPage() {
    const [calls, setCalls] = useState([])
    const [usersMap, setUsersMap] = useState({})   // userId → display name
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        // Subscribe to emergency_calls
        const unsubCalls = firestoreService.subscribe('emergency_calls', (data) => {
            const normalized = data.map(doc => ({
                ...doc,
                // Normalize both 'service' and 'type' fields to canonical key
                type: normalizeService(doc.service || doc.type),
            }))
            setCalls(normalized.sort((a, b) => dateUtils.compare(a.timestamp, b.timestamp)))
            setLoading(false)
        }, (err) => {
            console.error('Error subscribing to emergency_calls:', err)
            setLoading(false)
        })

        // Subscribe to users to build name lookup map
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

        return () => { unsubCalls(); unsubUsers() }
    }, [])

    const filtered = filter === 'all' ? calls : calls.filter(c => c.type === filter)

    const exportCSV = () => {
        const headers = 'Service,Number,Timestamp,User\n'
        const rows = filtered.map(c =>
            `${c.type},${c.number || ''},${dateUtils.format(c.timestamp)},${usersMap[c.userId] || c.userId}`
        )
        const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'emergency_calls.csv'
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Emergency Call Monitoring</h1>
                    <p className="text-sm text-gray-500">Real-time tracking of all emergency activity</p>
                </div>
                <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
                    <Download size={15} /> Export CSV
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
                {Object.entries(typeIcons).map(([type, icon]) => {
                    const count = calls.filter(c => c.type === type).length
                    return (
                        <button
                            key={type}
                            onClick={() => setFilter(filter === type ? 'all' : type)}
                            className={`stat-card bg-white rounded-xl p-4 shadow-sm border text-left transition-all
                                ${filter === type ? 'border-purple-400 ring-2 ring-purple-200' : 'border-gray-100'}`}
                        >
                            <p className="text-2xl mb-1">{icon}</p>
                            <p className="text-xl font-bold text-gray-900">{count}</p>
                            <p className="text-xs text-gray-500">{type}</p>
                        </button>
                    )
                })}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter size={15} className="text-gray-400" />
                <span className="text-sm text-gray-500">Filter:</span>
                {['all', 'Police', 'Ambulance', 'Fire Brigade', 'GBV', 'Child Support'].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === t
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'}`}
                    >
                        {t === 'all' ? 'All Types' : t}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-700">{filtered.length} calls</p>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-purple-600 mb-2" size={32} />
                        <p className="text-sm text-gray-500 font-medium">Loading calls...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <p className="text-4xl mb-3">📞</p>
                        <p className="text-sm font-medium text-gray-500">No calls recorded yet</p>
                        <p className="text-xs text-gray-400 mt-1">Emergency calls from the app will appear here</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Service', 'Number', 'Timestamp', 'User'].map(h => (
                                        <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeColors[c.type] || 'bg-gray-100 text-gray-600'}`}>
                                                {typeIcons[c.type] || '📞'} {c.type}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 font-mono font-semibold text-gray-700">{c.number || '—'}</td>
                                        <td className="px-5 py-4 text-gray-700">{dateUtils.format(c.timestamp)}</td>
                                        <td className="px-5 py-4 text-gray-700 font-medium">
                                            {usersMap[c.userId] || c.userId || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
