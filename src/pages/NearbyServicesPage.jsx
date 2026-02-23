import { useState, useEffect } from 'react'
import { firestoreService } from '../firebase/firestoreService'
import { Plus, Edit2, X, Save, MapPin, Loader2 } from 'lucide-react'

const typeColors = { Police: 'bg-blue-100 text-blue-700', Hospital: 'bg-red-100 text-red-700', Fire: 'bg-orange-100 text-orange-700' }
const EMPTY = { name: '', type: 'Police', phone: '', location: '', rating: 4.0, status: 'Open' }

export default function NearbyServicesPage() {
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [modal, setModal] = useState(null)
    const [form, setForm] = useState(EMPTY)

    useEffect(() => {
        const unsubscribe = firestoreService.subscribe('stations', (data) => {
            setStations(data)
            setLoading(false)
        })
        return () => unsubscribe()
    }, [])

    const toggleStatus = async (id, currentStatus) => {
        try {
            await firestoreService.update('stations', id, {
                status: currentStatus === 'Open' ? 'Closed' : 'Open'
            })
        } catch (error) {
            console.error('Error toggling status:', error)
        }
    }

    const openAdd = () => { setForm(EMPTY); setModal('add') }
    const openEdit = (st) => { setForm(st); setModal(st) }
    const close = () => setModal(null)

    const save = async () => {
        try {
            if (modal === 'add') {
                await firestoreService.add('stations', form)
            } else {
                await firestoreService.update('stations', modal.id, form)
            }
            close()
        } catch (error) {
            console.error('Error saving station:', error)
        }
    }

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nearby Services</h1>
                    <p className="text-sm text-gray-500">Manage emergency service station listings</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition shadow-lg shadow-blue-200">
                    <Plus size={15} /> Add Station
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Loader2 className="animate-spin text-blue-600 mb-2" size={32} />
                        <p className="text-sm text-gray-500 font-medium">Loading service stations...</p>
                    </div>
                ) : (
                    stations.map(s => (
                        <div key={s.id} className="stat-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="flex items-start justify-between mb-3">
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${typeColors[s.type] ?? 'bg-gray-100 text-gray-600'}`}>{s.type}</span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => toggleStatus(s.id, s.status)}
                                        className={`relative w-10 h-5 rounded-full transition-colors flex items-center ${s.status === 'Open' ? 'bg-green-400' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-all ${s.status === 'Open' ? 'left-5' : 'left-0.5'}`} />
                                    </button>
                                    <button onClick={() => openEdit(s)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition"><Edit2 size={14} /></button>
                                </div>
                            </div>
                            <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><MapPin size={11} /> {s.location}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.phone}</p>
                            <div className="flex items-center justify-between mt-3">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${s.status === 'Open' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {s.status}
                                </span>
                                <span className="text-xs text-yellow-600">★ {s.rating}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {modal !== null && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">{modal === 'add' ? 'Add Station' : 'Edit Station'}</h3>
                            <button onClick={close}><X size={16} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'name', label: 'Station Name', placeholder: 'e.g. Sandton Police Station' },
                                { key: 'phone', label: 'Phone', placeholder: '+27 11 000 0000' },
                                { key: 'location', label: 'Location', placeholder: 'e.g. Sandton CBD' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">{f.label}</label>
                                    <input value={form[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                                </div>
                            ))}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Type</label>
                                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300">
                                    <option>Police</option><option>Hospital</option><option>Fire</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                                    <option>Open</option><option>Closed</option>
                                </select>
                            </div>
                        </div>
                        <button onClick={save} className="w-full mt-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition">
                            <Save size={14} className="inline mr-1.5" /> Save Station
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
