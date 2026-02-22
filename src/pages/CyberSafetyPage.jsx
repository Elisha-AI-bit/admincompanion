import { useState } from 'react'
import { mockScamReports, mockCyberRisk, mockScamKeywords } from '../data/mockData'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts'
import { AlertTriangle, ShieldCheck, Download } from 'lucide-react'

const riskColors = {
    'HIGH RISK': { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
    'CAUTION': { badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    'SAFE': { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
}

export default function CyberSafetyPage() {
    const [reports] = useState(mockScamReports)

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Cyber Safety Module</h1>
                <p className="text-sm text-gray-500">Scam report analysis, keyword trends, and risk management</p>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Risk Level Distribution</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={mockCyberRisk} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {mockCyberRisk.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Top Scam Keywords</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={mockScamKeywords} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                            <YAxis dataKey="keyword" type="category" tick={{ fontSize: 11, fill: '#6B7280' }} width={110} />
                            <Tooltip />
                            <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                {mockScamKeywords.map((_, i) => (
                                    <Cell key={i} fill={i === 0 ? '#DC2626' : i === 1 ? '#EF4444' : i === 2 ? '#F97316' : '#F59E0B'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Reports table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Scam Reports</h2>
                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-lg">
                            <AlertTriangle size={12} />
                            {reports.filter(r => r.riskLevel === 'HIGH RISK').length} High Risk
                        </span>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition">
                            <Download size={13} /> Export
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {reports.map(r => (
                        <div key={r.id} className="px-6 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                            <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${riskColors[r.riskLevel]?.dot ?? 'bg-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-700 truncate">{r.message}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{new Date(r.timestamp).toLocaleString()} · User {r.userId}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium flex-shrink-0 ${riskColors[r.riskLevel]?.badge}`}>
                                {r.riskLevel}
                            </span>
                            <div className="flex gap-1 flex-shrink-0">
                                <button className="px-2 py-1 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">Blacklist</button>
                                <button className="px-2 py-1 text-xs rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition">Dismiss</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
