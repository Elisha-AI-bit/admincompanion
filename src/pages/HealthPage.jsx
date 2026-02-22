import { useState } from 'react'
import { mockDoctors } from '../data/mockData'
import { Plus, Edit2, Trash2, Star, X, Save } from 'lucide-react'

const EMPTY_DOC = { name: '', specialization: '', phone: '', rating: 5.0, availability: 'Mon-Fri' }

export default function HealthPage() {
    const [doctors, setDoctors] = useState(mockDoctors)
    const [modal, setModal] = useState(null) // null | 'add' | { ...doctor }
    const [form, setForm] = useState(EMPTY_DOC)

    const openAdd = () => { setForm(EMPTY_DOC); setModal('add') }
    const openEdit = (doc) => { setForm(doc); setModal(doc) }
    const close = () => setModal(null)

    const save = () => {
        if (modal === 'add') {
            setDoctors(prev => [...prev, { ...form, id: `d${Date.now()}` }])
        } else {
            setDoctors(prev => prev.map(d => d.id === modal.id ? { ...form, id: d.id } : d))
        }
        close()
    }

    const remove = (id) => setDoctors(prev => prev.filter(d => d.id !== id))

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Health Management</h1>
                    <p className="text-sm text-gray-500">Manage doctors, guides, and health templates</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-green-200">
                    <Plus size={15} /> Add Doctor
                </button>
            </div>

            {/* Overview cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Doctors', value: doctors.length, color: 'from-green-500 to-emerald-600' },
                    { label: 'Herbalists', value: 8, color: 'from-teal-500 to-cyan-600' },
                    { label: 'Lab Templates', value: 24, color: 'from-blue-500 to-indigo-600' },
                    { label: 'Vaccination Records', value: 156, color: 'from-purple-500 to-violet-600' },
                ].map(s => (
                    <div key={s.label} className="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 text-white font-bold text-lg`}>
                            {s.value}
                        </div>
                        <p className="text-sm text-gray-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Doctors grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {doctors.map(doc => (
                    <div key={doc.id} className="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold">
                                {doc.name.charAt(3)}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openEdit(doc)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition"><Edit2 size={14} /></button>
                                <button onClick={() => remove(doc.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{doc.specialization}</p>
                        <p className="text-xs text-gray-400 mt-1">{doc.phone}</p>
                        <div className="flex items-center justify-between mt-3">
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-lg">{doc.availability}</span>
                            <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                                <Star size={12} className="fill-yellow-400 text-yellow-400" /> {doc.rating}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add/Edit modal */}
            {modal !== null && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">{modal === 'add' ? 'Add Doctor' : 'Edit Doctor'}</h3>
                            <button onClick={close}><X size={16} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'name', label: 'Full Name', placeholder: 'Dr. Full Name' },
                                { key: 'specialization', label: 'Specialization', placeholder: 'e.g. Cardiologist' },
                                { key: 'phone', label: 'Phone', placeholder: '+27 11 000 0000' },
                                { key: 'availability', label: 'Availability', placeholder: 'Mon-Fri' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{f.label}</label>
                                    <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300" />
                                </div>
                            ))}
                        </div>
                        <button onClick={save} className="w-full mt-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition">
                            <Save size={14} className="inline mr-1.5" /> Save Doctor
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
