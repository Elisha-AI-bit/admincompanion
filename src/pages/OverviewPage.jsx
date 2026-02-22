import StatCard from '../components/ui/StatCard'
import {
    Users, Phone, ShieldAlert, Globe, Heart, MapPin,
    Activity, TrendingUp, CheckCircle
} from 'lucide-react'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { mockCallsTrend, mockCyberRisk, mockSymptoms } from '../data/mockData'

const CALL_COLORS = {
    Police: '#3B82F6',
    Ambulance: '#EF4444',
    Fire: '#F97316',
    GBV: '#A855F7',
    Cyber: '#14B8A6',
}

export default function OverviewPage() {
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
                <StatCard title="Total Users" value="12,480" change={8.2} icon={Users} color="purple" sub="Registered accounts" />
                <StatCard title="Active Today" value="3,241" change={12.5} icon={Activity} color="blue" sub="Unique sessions" />
                <StatCard title="Emergency Calls" value="247" change={-3.1} icon={Phone} color="red" sub="Today" />
                <StatCard title="Scam Reports" value="89" change={5.4} icon={Globe} color="orange" sub="Today" />
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard title="Health Searches" value="1,820" change={14.0} icon={Heart} color="green" sub="Today" />
                <StatCard title="Service Requests" value="534" change={6.7} icon={MapPin} color="indigo" sub="Nearby services" />
                <StatCard title="Threats Blocked" value="1,024" change={22.1} icon={ShieldAlert} color="purple" sub="All time" />
                <StatCard title="Uptime" value="99.9%" icon={CheckCircle} color="green" sub="Last 30 days" />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Emergency calls trend */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="font-semibold text-gray-800 mb-4">Emergency Calls — Last 7 Days</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={mockCallsTrend}>
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
                            <Pie data={mockCyberRisk} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                {mockCyberRisk.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2">
                        {mockCyberRisk.map(e => (
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
                    <BarChart data={mockSymptoms} layout="vertical">
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
        </div>
    )
}
