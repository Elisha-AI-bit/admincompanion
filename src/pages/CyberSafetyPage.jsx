import { useState, useEffect } from 'react'
import { firestoreService } from '../firebase/firestoreService'
import { db } from '../firebase/config'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TriangleAlert, ShieldCheck, Download, Loader2, Phishing, Phone, Shield, ExternalLink, User, Settings, Lock } from 'lucide-react'
import { dateUtils } from '../utils/dateUtils'

const riskColors = {
    'HIGH RISK': { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    'CAUTION': { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    'SAFE': { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

export default function CyberSafetyPage() {
    const [logs, setLogs] = useState([])
    const [usersMap, setUsersMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [riskDistribution, setRiskDistribution] = useState([])

    // Live action_logs listener for Cyber Safety events
    useEffect(() => {
        const q = query(
            collection(db, 'action_logs'),
            orderBy('timestamp', 'desc')
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

            // Filter for cyber safety related logs (new system) OR scam reports (old system compatible)
            const cyberLogs = allLogs.filter(log =>
                log.actionType?.startsWith('cyber_safety_') ||
                log.actionType === 'emergency_call' && log.details?.serviceName === 'Cyber Crime'
            )

            setLogs(cyberLogs)

            // Calculate Risk Distribution from scam scans
            const scans = cyberLogs.filter(l => l.actionType === 'cyber_safety_scam_scan')
            const highRisk = scans.filter(s => s.details?.isScam).length
            const safe = scans.filter(s => !s.details?.isScam).length

            setRiskDistribution([
                { name: 'HIGH RISK', value: highRisk, color: '#EF4444' },
                { name: 'SAFE', value: safe, color: '#10B981' }
            ])

            setLoading(false)
        }, (error) => {
            console.error('Error listening to cyber logs:', error)
            setLoading(false)
        })

        return () => unsubscribe()
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

    const getActionIcon = (type) => {
        switch (type) {
            case 'cyber_safety_scam_scan': return <TriangleAlert className="text-orange-500" size={18} />
            case 'cyber_safety_alarm_enabled': return <ShieldCheck className="text-green-500" size={18} />
            case 'cyber_safety_alarm_disabled': return <Shield className="text-gray-400" size={18} />
            case 'cyber_safety_open_find_my_device': return <ExternalLink className="text-blue-500" size={18} />
            case 'cyber_safety_open_security_settings': return <Settings className="text-purple-500" size={18} />
            case 'cyber_safety_open_add_google_account': return <User className="text-indigo-500" size={18} />
            case 'emergency_call': return <Phone className="text-red-500" size={18} />
            default: return <Lock className="text-gray-400" size={18} />
        }
    }

    const getActionLabel = (log) => {
        if (log.actionType === 'emergency_call') return 'Emergency Call: Cyber Crime'
        const type = log.actionType?.replace('cyber_safety_', '').replace(/_/g, ' ')
        return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Cyber Interaction'
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Cyber Safety Module</h1>
                <p className="text-sm text-gray-500">Real-time monitoring of phishing scans, alarm status, and security actions</p>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-1">
                    <h2 className="font-semibold text-gray-800 mb-4">Risk Detection Rate</h2>
                    {loading ? (
                        <div className="h-[200px] flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>
                    ) : riskDistribution.reduce((a, b) => a + b.value, 0) === 0 ? (
                        <div className="h-[200px] flex flex-col items-center justify-center text-gray-400 text-sm">
                            <ShieldCheck size={40} className="mb-2 opacity-20" />
                            No scans recorded yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={riskDistribution.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {riskDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                    <h2 className="font-semibold text-gray-800 mb-4">Real-time Activity Feed</h2>
                    <div className="h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>
                        ) : logs.length === 0 ? (
                            <p className="text-center text-gray-400 py-10 text-sm">Waiting for live data...</p>
                        ) : (
                            <div className="space-y-3">
                                {logs.slice(0, 10).map(log => (
                                    <div key={log.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white rounded-lg shadow-sm">
                                                {getActionIcon(log.actionType)}
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-800">{getActionLabel(log)}</p>
                                                <p className="text-[10px] text-gray-500">{usersMap[log.userId] || 'User ' + log.userId?.substring(0, 6)} · {dateUtils.format(log.timestamp)}</p>
                                            </div>
                                        </div>
                                        {log.actionType === 'cyber_safety_scam_scan' && (
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.details?.isScam ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {log.details?.isScam ? 'SCAM' : 'SAFE'}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comprehensive Logs Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Cyber Safety Log History</h2>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition">
                        <Download size={13} /> Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold">
                            <tr>
                                <th className="px-6 py-3">Timestamp</th>
                                <th className="px-6 py-3">User</th>
                                <th className="px-6 py-3">Action</th>
                                <th className="px-6 py-3">Details</th>
                                <th className="px-6 py-3">Platform</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center"><Loader2 className="animate-spin text-purple-600 inline mr-2" /> Loading records...</td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400">No logs found</td>
                                </tr>
                            ) : (
                                logs.map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-xs">{dateUtils.format(log.timestamp)}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{usersMap[log.userId] || 'Unknown'}</div>
                                            <div className="text-[10px] text-gray-400">{log.userId?.substring(0, 12)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-[10px] font-semibold uppercase tracking-wider">
                                                {getActionLabel(log)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate text-[11px] text-gray-500">
                                                {log.details?.snippet || log.details?.result || log.details?.serviceName || JSON.stringify(log.details || {})}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] uppercase font-bold text-gray-400">{log.platform || 'mobile'}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
