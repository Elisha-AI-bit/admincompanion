import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { firestoreService } from '../firebase/firestoreService'
import { Save, Bell, Shield, Key, Loader2 } from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuth()
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
    })
    const [notifications, setNotifications] = useState({
        highRisk: true, emergencySurge: true, systemDowntime: true, doctorApproval: false
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const save = async () => {
        setSaving(true)
        try {
            if (user?.uid) {
                await firestoreService.update('users', user.uid, {
                    name: form.name,
                    notifications
                })
                setSaved(true)
                setTimeout(() => setSaved(false), 2000)
            }
        } catch (error) {
            console.error('Error saving settings:', error)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6 fade-in max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-500">Manage your profile and notification preferences</p>
            </div>

            {/* Profile section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Shield size={16} className="text-purple-600" />
                    <h2 className="font-semibold text-gray-800">Admin Profile</h2>
                </div>
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                        {form.name?.charAt(0) ?? 'A'}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{form.name}</p>
                        <p className="text-sm text-gray-500">{form.email}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-medium mt-1 inline-block">
                            {user?.role?.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                            className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                        <input
                            value={form.email}
                            disabled
                            className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* Security section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Key size={16} className="text-purple-600" />
                    <h2 className="font-semibold text-gray-800">Security</h2>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">New Password</label>
                        <input type="password" placeholder="••••••••"
                            className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase">Confirm Password</label>
                        <input type="password" placeholder="••••••••"
                            className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    <Bell size={16} className="text-purple-600" />
                    <h2 className="font-semibold text-gray-800">Notification Preferences</h2>
                </div>
                <div className="space-y-4">
                    {[
                        { key: 'highRisk', label: 'High-risk scam alerts', desc: 'Get notified when HIGH RISK scams are detected' },
                        { key: 'emergencySurge', label: 'Emergency call surge', desc: 'Alert when call volume exceeds threshold' },
                        { key: 'systemDowntime', label: 'System downtime alerts', desc: 'Firebase service outage notifications' },
                        { key: 'doctorApproval', label: 'Doctor profile approvals', desc: 'New telemedicine profile pending review' },
                    ].map(n => (
                        <div key={n.key} className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{n.label}</p>
                                <p className="text-xs text-gray-400">{n.desc}</p>
                            </div>
                            <button
                                onClick={() => setNotifications(p => ({ ...p, [n.key]: !p[n.key] }))}
                                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[n.key] ? 'bg-purple-500' : 'bg-gray-200'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notifications[n.key] ? 'left-6' : 'left-1'}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-purple-200"
            >
                {saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />}
                {saved ? '✓ Saved Changes' : 'Save Changes'}
            </button>
        </div>
    )
}
