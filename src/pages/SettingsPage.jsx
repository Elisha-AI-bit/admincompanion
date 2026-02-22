import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Save, Bell, Shield, Key } from 'lucide-react'

export default function SettingsPage() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState({
        highRisk: true, emergencySurge: true, systemDowntime: true, doctorApproval: false
    })
    const [saved, setSaved] = useState(false)

    const save = () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
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
                        {user?.name?.charAt(0) ?? 'A'}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-lg font-medium mt-1 inline-block">
                            {user?.role?.replace('_', ' ')}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { label: 'Full Name', value: user?.name, key: 'name' },
                        { label: 'Email', value: user?.email, key: 'email' },
                    ].map(f => (
                        <div key={f.key}>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{f.label}</label>
                            <input defaultValue={f.value}
                                className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                        </div>
                    ))}
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

            <button onClick={save}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-90 transition shadow-lg shadow-purple-200">
                <Save size={15} /> {saved ? '✓ Saved!' : 'Save Changes'}
            </button>

            {/* Firebase connect notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-sm font-semibold text-amber-800 mb-1">🔥 Connect Firebase</p>
                <p className="text-xs text-amber-700">
                    Replace the stub credentials in <code className="bg-amber-100 px-1 rounded">src/firebase/config.js</code> with your real Firebase project config from the{' '}
                    <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="underline font-medium">Firebase Console</a>.
                    Enable Email/Password auth and create your Firestore collections per the PRD schema.
                </p>
            </div>
        </div>
    )
}
