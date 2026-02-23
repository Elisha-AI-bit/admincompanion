import { useState } from 'react'
import { db } from '../firebase/config'
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore'
import * as mockData from '../data/mockData'
import { Database, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function MigrationPage() {
    const [status, setStatus] = useState('idle')
    const [log, setLog] = useState([])

    const addLog = (msg) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])

    const migrateData = async () => {
        setStatus('loading')
        setLog([])
        addLog('Starting migration...')

        try {
            const collections = [
                { name: 'users', data: mockData.mockUsers },
                { name: 'emergencyCalls', data: mockData.mockEmergencyCalls },
                { name: 'callsTrend', data: mockData.mockCallsTrend },
                { name: 'cyberRisk', data: mockData.mockCyberRisk },
                { name: 'scamKeywords', data: mockData.mockScamKeywords },
                { name: 'scamReports', data: mockData.mockScamReports },
                { name: 'doctors', data: mockData.mockDoctors },
                { name: 'stations', data: mockData.mockStations },
                { name: 'news', data: mockData.mockNews },
                { name: 'hotlines', data: mockData.mockHotlines },
                { name: 'healthTrend', data: mockData.mockHealthTrend },
                { name: 'symptoms', data: mockData.mockSymptoms },
            ]

            for (const coll of collections) {
                addLog(`Migrating ${coll.name}...`)
                const batch = writeBatch(db)

                coll.data.forEach((item) => {
                    const docRef = doc(collection(db, coll.name), item.id || `${coll.name}_${Math.random().toString(36).substr(2, 9)}`)
                    batch.set(docRef, item)
                })

                await batch.commit()
                addLog(`Successfully migrated ${coll.name} (${coll.data.length} items)`)
            }

            addLog('Migration complete! 🎉')
            setStatus('success')
        } catch (error) {
            console.error('Migration error:', error)
            addLog(`ERROR: ${error.message}`)
            setStatus('error')
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-6">
            <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-8">
                <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
                        <Database size={32} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Data Migration</h1>
                        <p className="text-gray-500 text-sm">Push all mock data to your live Firestore database</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <p className="text-sm text-amber-800 font-medium">⚠️ Important</p>
                        <p className="text-xs text-amber-700 mt-1">
                            Ensure you have set up your Firestore Security Rules to allow writes.
                            For testing, you can use "test mode" in the Firebase Console.
                        </p>
                    </div>

                    <button
                        onClick={migrateData}
                        disabled={status === 'loading'}
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${status === 'loading'
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-200 hover:scale-[1.02]'
                            }`}
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Migrating...
                            </>
                        ) : (
                            'Start Migration'
                        )}
                    </button>

                    {log.length > 0 && (
                        <div className="mt-8">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Migration Log</p>
                            <div className="bg-gray-900 rounded-2xl p-4 h-64 overflow-y-auto font-mono text-xs text-green-400 border border-gray-800 shadow-inner">
                                {log.map((line, i) => <p key={i} className="mb-1">{line}</p>)}
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="mt-6 flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700">
                            <CheckCircle size={20} />
                            <p className="text-sm font-medium">All data migrated successfully!</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mt-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">Migration failed. Check console for details.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
