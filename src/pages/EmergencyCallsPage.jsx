import { useState } from 'react'
import { mockEmergencyCalls } from '../data/mockData'
import { Phone, Filter, Download } from 'lucide-react'

const typeColors = {
    Police: 'bg-blue-100 text-blue-700',
    Ambulance: 'bg-red-100 text-red-700',
    Fire: 'bg-orange-100 text-orange-700',
    GBV: 'bg-purple-100 text-purple-700',
    Cyber: 'bg-teal-100 text-teal-700',
}

const typeIcons = { Police: '🚔', Ambulance: '🚑', Fire: '🚒', GBV: '💜', Cyber: '🛡️' }

export default function EmergencyCallsPage() {
    const [filter, setFilter] = useState('all')
    const filtered = filter === 'all' ? mockEmergencyCalls : mockEmergencyCalls.filter(c => c.type === filter)

    const exportCSV = () => {
        const headers = 'ID,Type,Timestamp,User ID,Lat,Lng,Response Time (s)\n'
        const rows = filtered.map(c => `${c.id},${c.type},${c.timestamp},${c.userId},${c.location.lat},${c.location.lng},${c.responseTime}`)
        const blob = new Blob([headers + rows.join('\n')], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = 'emergency_calls.csv'; a.click()
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
                    const count = mockEmergencyCalls.filter(c => c.type === type).length
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
            <div className="flex items-center gap-2">
                <Filter size={15} className="text-gray-400" />
                <span className="text-sm text-gray-500">Filter:</span>
                {['all', 'Police', 'Ambulance', 'Fire', 'GBV', 'Cyber'].map(t => (
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
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                {['Type', 'Timestamp', 'User ID', 'Location', 'Response Time'].map(h => (
                                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeColors[c.type]}`}>
                                            {typeIcons[c.type]} {c.type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-gray-700">{new Date(c.timestamp).toLocaleString()}</td>
                                    <td className="px-5 py-4 text-gray-500 font-mono text-xs">{c.userId}</td>
                                    <td className="px-5 py-4 text-gray-500 text-xs">{c.location.lat.toFixed(3)}, {c.location.lng.toFixed(3)}</td>
                                    <td className="px-5 py-4">
                                        <span className={`font-semibold ${c.responseTime < 3 ? 'text-green-600' : 'text-orange-500'}`}>
                                            {c.responseTime}s
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
