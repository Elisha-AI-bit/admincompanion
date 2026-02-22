export default function StatCard({ title, value, change, icon: Icon, color = 'purple', sub }) {
    const colors = {
        purple: { bg: 'from-[#6B46C1] to-[#9333EA]', light: 'bg-purple-50 text-purple-600' },
        blue: { bg: 'from-[#2563EB] to-[#3B82F6]', light: 'bg-blue-50 text-blue-600' },
        red: { bg: 'from-[#DC2626] to-[#EF4444]', light: 'bg-red-50 text-red-600' },
        green: { bg: 'from-[#059669] to-[#10B981]', light: 'bg-green-50 text-green-600' },
        orange: { bg: 'from-[#D97706] to-[#F59E0B]', light: 'bg-orange-50 text-orange-600' },
        indigo: { bg: 'from-[#4338CA] to-[#6366F1]', light: 'bg-indigo-50 text-indigo-600' },
    }
    const c = colors[color] ?? colors.purple

    return (
        <div className="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100 fade-in">
            <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-lg`}>
                    {Icon && <Icon size={20} className="text-white" />}
                </div>
                {change !== undefined && (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
                    </span>
                )}
            </div>
            <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500 mt-0.5">{title}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
        </div>
    )
}
