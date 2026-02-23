import { useState, useEffect } from 'react'
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

export default function AnalyticsPage() {
    const [data, setData] = useState({
        userGrowth: [],
        healthTrend: [],
        callsTrend: []
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                const [userGrowthData, healthTrendData, callsTrendData] = await Promise.all([
                    firestoreService.getAll('userGrowth'),
                    firestoreService.getAll('healthTrend'),
                    firestoreService.getAll('callsTrend')
                ])
                setData({
                    userGrowth: userGrowthData.sort((a, b) => dateUtils.compare(a.month, b.month, false)),
                    healthTrend: healthTrendData.sort((a, b) => dateUtils.compare(a.month, b.month, false)),
                    callsTrend: callsTrendData
                })
                setLoading(false)
            } catch (error) {
                console.error('Error fetching analytics data:', error)
            }
        }
        fetchAnalyticsData()
    }, [])

    const exportReport = (label) => {
        alert(`Exporting "${label}" report…`)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="animate-spin text-purple-600 mb-4" size={48} />
                <p className="text-gray-500 font-medium">Preparing detailed analytics reports...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
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
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-gray-800">User Growth</h2>
                        <TrendingUp size={16} className="text-green-500" />
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={data.userGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                            <Line type="monotone" dataKey="users" stroke="#6B46C1" strokeWidth={2.5} dot={{ fill: '#6B46C1', r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Health Feature Usage</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.healthTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="searches" fill="url(#healthGrad2)" radius={[6, 6, 0, 0]} />
                            <defs>
                                <linearGradient id="healthGrad2" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#34D399" />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Emergency Calls by Type — 7 Days</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={data.callsTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                            <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Bar dataKey="Police" fill="#3B82F6" stackId="a" />
                            <Bar dataKey="Ambulance" fill="#EF4444" stackId="a" />
                            <Bar dataKey="Fire" fill="#F97316" stackId="a" />
                            <Bar dataKey="GBV" fill="#A855F7" stackId="a" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="Cyber" fill="#14B8A6" stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Export buttons */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="font-semibold text-gray-800 mb-4">Export Reports</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        'Monthly Emergency Calls',
                        'Cyber Threat Trends',
                        'Health Feature Usage',
                        'User Growth Metrics',
                    ].map(label => (
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
