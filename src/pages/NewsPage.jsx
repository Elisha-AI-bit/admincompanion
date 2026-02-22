import { useState } from 'react'
import { mockNews } from '../data/mockData'
import { Plus, Pin, Trash2, Edit2, X, Save, Newspaper } from 'lucide-react'

const EMPTY = { title: '', source: '', publishedAt: '', imageUrl: '', pinned: false }

export default function NewsPage() {
    const [articles, setArticles] = useState(mockNews)
    const [modal, setModal] = useState(null)
    const [form, setForm] = useState(EMPTY)

    const openAdd = () => { setForm(EMPTY); setModal('add') }
    const openEdit = (a) => { setForm(a); setModal(a) }
    const close = () => setModal(null)

    const save = () => {
        if (modal === 'add') setArticles(prev => [...prev, { ...form, id: `n${Date.now()}` }])
        else setArticles(prev => prev.map(a => a.id === modal.id ? { ...form, id: a.id } : a))
        close()
    }

    const remove = (id) => setArticles(prev => prev.filter(a => a.id !== id))
    const togglePin = (id) => setArticles(prev => prev.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a))

    return (
        <div className="space-y-6 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">News & Content</h1>
                    <p className="text-sm text-gray-500">Manage safety news and community alerts</p>
                </div>
                <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
                    <Plus size={15} /> Add Article
                </button>
            </div>

            <div className="space-y-3">
                {articles.map(a => (
                    <div key={a.id} className={`stat-card bg-white rounded-2xl p-5 shadow-sm border flex items-start gap-4 ${a.pinned ? 'border-purple-300 bg-purple-50/30' : 'border-gray-100'}`}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                            <Newspaper size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2">
                                {a.pinned && <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md flex-shrink-0"><Pin size={9} />PINNED</span>}
                                <h3 className="text-sm font-semibold text-gray-900 leading-snug">{a.title}</h3>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{a.source} · {a.publishedAt}</p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                            <button onClick={() => togglePin(a.id)} className={`p-1.5 rounded-lg transition ${a.pinned ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-100 text-gray-400 hover:text-purple-600'}`}>
                                <Pin size={14} />
                            </button>
                            <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition"><Edit2 size={14} /></button>
                            <button onClick={() => remove(a.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition"><Trash2 size={14} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {modal !== null && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900">{modal === 'add' ? 'Add Article' : 'Edit Article'}</h3>
                            <button onClick={close}><X size={16} className="text-gray-400" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: 'title', label: 'Title', placeholder: 'Article headline…' },
                                { key: 'source', label: 'Source', placeholder: 'e.g. SAPS, Dept of Health' },
                                { key: 'publishedAt', label: 'Date', placeholder: '2026-02-22' },
                                { key: 'imageUrl', label: 'Image URL (optional)', placeholder: 'https://…' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">{f.label}</label>
                                    <input value={form[f.key] ?? ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                        placeholder={f.placeholder}
                                        className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                                </div>
                            ))}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.pinned} onChange={e => setForm(p => ({ ...p, pinned: e.target.checked }))} className="w-4 h-4 accent-purple-600" />
                                <span className="text-sm text-gray-700">Pin this article</span>
                            </label>
                        </div>
                        <button onClick={save} className="w-full mt-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl text-sm hover:opacity-90 transition">
                            <Save size={14} className="inline mr-1.5" /> Save Article
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
