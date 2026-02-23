import { useState, useEffect } from 'react'
import { firestoreService } from '../firebase/firestoreService'
import { ShieldAlert, Edit2, Save, X, Radio, MapPin, Video, Loader2 } from 'lucide-react'

export default function PhysicalSafetyPage() {
    const [hotlines, setHotlines] = useState([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState(null)
    const [editVal, setEditVal] = useState('')

    const [error, setError] = useState(null)

    useEffect(() => {
        const unsubscribe = firestoreService.subscribe('hotlines',
            (data) => {
                setHotlines(data || [])
                setLoading(false)
                setError(null)
            },
            (err) => {
                console.error('Error subscribing to hotlines:', err)
                setError('Failed to load hotlines.')
                setLoading(false)
            }
        )
        return () => unsubscribe()
    }, [])

    const startEdit = (service, number) => { setEditingId(service); setEditVal(number) }
    const saveEdit = async (id, service) => {
        try {
            await firestoreService.update('hotlines', id, { number: editVal })
            setEditingId(null)
        } catch (error) {
            console.error('Error saving hotline:', error)
        }
    }

    const stats = [
        { label: 'Active Recordings', value: '14', icon: Video, color: 'from-purple-500 to-indigo-600' },
        { label: 'Location Shares', value: '87', icon: MapPin, color: 'from-blue-500 to-cyan-500' },
        { label: 'Beacon Activations', value: '6', icon: Radio, color: 'from-red-500 to-orange-500' },
        { label: 'SOS Alerts Today', value: '23', icon: ShieldAlert, color: 'from-pink-500 to-rose-500' },
    ]

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Physical Safety Module</h1>
                <p className="text-sm text-gray-500">Monitor recordings, location shares, and manage hotlines</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(s => (
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
                            <p className="text-sm text-gray-500 font-medium">No hotlines found.</p>
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
                                        <button onClick={() => saveEdit(h.id, h.service)} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">
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

            {/* Beacon log */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-800 mb-4">Recent Beacon Activations</h2>
                <div className="space-y-3">
                    {[
                        { user: 'Kagiso Baloyi', time: '10:22 AM', location: 'Soweto', status: 'Resolved' },
                        { user: 'Neo Khumalo', time: '09:15 AM', location: 'Sandton', status: 'Active' },
                        { user: 'Zara Patel', time: '08:48 AM', location: 'Randburg', status: 'Resolved' },
                    ].map((b, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-rose-500 text-white flex items-center justify-center text-xs font-bold">
                                    {b.user.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{b.user}</p>
                                    <p className="text-xs text-gray-500">{b.time} · {b.location}</p>
                                </div>
                            </div>
                            <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${b.status === 'Active' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {b.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
