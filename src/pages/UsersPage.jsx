import { useState, useEffect } from 'react'
import { firestoreService } from '../firebase/firestoreService'
import { Search, UserCheck, UserX, Shield, MoreVertical, X, Loader2, Trash2 } from 'lucide-react'
import { dateUtils } from '../utils/dateUtils'

const roleColors = {
    super_admin: 'bg-purple-100 text-purple-700',
    moderator: 'bg-blue-100 text-blue-700',
    health_admin: 'bg-green-100 text-green-700',
    cyber_admin: 'bg-orange-100 text-orange-700',
    user: 'bg-gray-100 text-gray-600',
}

const roleLabels = {
    super_admin: 'Super Admin', moderator: 'Moderator',
    health_admin: 'Health Admin', cyber_admin: 'Cyber Analyst', user: 'User'
}

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [selectedUser, setSelectedUser] = useState(null)

    const [error, setError] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const deleteAllUsers = async () => {
        if (!window.confirm(`Delete ALL ${users.length} users from Firestore? This cannot be undone.`)) return
        if (!window.confirm('Are you absolutely sure? This will permanently delete every user record.')) return
        setDeleting(true)
        try {
            await Promise.all(users.map(u => firestoreService.delete('users', u.id)))
        } catch (err) {
            console.error('Error deleting all users:', err)
            setError('Failed to delete all users.')
        } finally {
            setDeleting(false)
        }
    }

    useEffect(() => {
        const unsubscribe = firestoreService.subscribe('users',
            (data) => {
                setUsers(data || [])
                setLoading(false)
                setError(null)
            },
            (err) => {
                console.error('Error subscribing to users:', err)
                setError('Failed to load users.')
                setLoading(false)
            }
        )
        return () => unsubscribe()
    }, [])

    const filtered = users.filter(u => {
        const matchSearch = String(u.name || '').toLowerCase().includes(search.toLowerCase()) ||
            String(u.email || '').toLowerCase().includes(search.toLowerCase())
        const matchRole = roleFilter === 'all' || u.role === roleFilter
        return matchSearch && matchRole
    })

    const toggleStatus = async (id, currentStatus) => {
        try {
            await firestoreService.update('users', id, {
                status: currentStatus === 'active' ? 'suspended' : 'active'
            })
        } catch (error) {
            console.error('Error toggling status:', error)
        }
    }

    const promoteRole = async (id, role) => {
        try {
            await firestoreService.update('users', id, { role })
        } catch (error) {
            console.error('Error promoting role:', error)
        }
    }

    const deleteUser = async (u) => {
        if (!window.confirm(`Delete ${u.name || u.email}? This cannot be undone.`)) return
        try {
            await firestoreService.delete('users', u.id)
        } catch (err) {
            console.error('Error deleting user:', err)
            setError('Failed to delete user.')
        }
    }

    return (
        <div className="space-y-6 fade-in">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-sm text-gray-500">Manage accounts, roles, and access</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search users…"
                        className="pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm w-full focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                    <option value="all">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="health_admin">Health Admin</option>
                    <option value="cyber_admin">Cyber Analyst</option>
                    <option value="user">User</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">{filtered.length} users</p>
                    <button
                        onClick={deleteAllUsers}
                        disabled={deleting || users.length === 0}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {deleting
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Trash2 size={13} />}
                        {deleting ? 'Deleting…' : 'Delete All Users'}
                    </button>
                </div>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-purple-600 mb-2" size={32} />
                        <p className="text-sm text-gray-500 font-medium">Loading users...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-red-50">
                        <p className="text-sm text-red-600 font-medium">{error}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <p className="text-sm text-gray-500 font-medium">No users found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Active</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(u => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {u.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{u.name}</p>
                                                    <p className="text-xs text-gray-400">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${roleColors[u.role]}`}>
                                                {roleLabels[u.role] ?? u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
                      ${u.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {u.status === 'active' ? 'Active' : 'Suspended'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-gray-500 text-xs">{dateUtils.format(u.lastActive)}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedUser(u)}
                                                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-purple-600 transition"
                                                    title="Manage"
                                                >
                                                    <Shield size={15} />
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(u)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition"
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => toggleStatus(u.id, u.status)}
                                                    className={`p-1.5 rounded-lg transition ${u.status === 'active'
                                                        ? 'hover:bg-red-50 text-gray-500 hover:text-red-600'
                                                        : 'hover:bg-green-50 text-gray-500 hover:text-green-600'}`}
                                                    title={u.status === 'active' ? 'Suspend' : 'Reactivate'}
                                                >
                                                    {u.status === 'active' ? <UserX size={15} /> : <UserCheck size={15} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">Manage User</h3>
                            <button onClick={() => setSelectedUser(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
                        </div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                {selectedUser.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">{selectedUser.name}</p>
                                <p className="text-sm text-gray-500">{selectedUser.email}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assign Role</label>
                                <select
                                    defaultValue={selectedUser.role}
                                    onChange={e => promoteRole(selectedUser.id, e.target.value)}
                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                                >
                                    <option value="user">User</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="health_admin">Health Admin</option>
                                    <option value="cyber_admin">Cyber Analyst</option>
                                    <option value="super_admin">Super Admin</option>
                                </select>
                            </div>
                            <button
                                onClick={() => { toggleStatus(selectedUser.id, selectedUser.status); setSelectedUser(null) }}
                                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${selectedUser.status === 'active'
                                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                    : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                            >
                                {selectedUser.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
