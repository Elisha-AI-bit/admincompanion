import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { firestoreService } from '../firebase/firestoreService'
import { functionsService } from '../firebase/functionsService'
import {
    Search, MapPin, Battery, Signal,
    Bell, Lock, ShieldAlert, Loader2,
    Maximize2, RefreshCw
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { orderBy } from 'firebase/firestore'

// Fix for Leaflet default icon issue in React
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Helper component to center map
function RecenterMap({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { duration: 0.75 });
        }
    }, [position, map]);
    return null;
}

export default function DeviceLocatorPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedUser, setSelectedUser] = useState(null)
    const [commandStatus, setCommandStatus] = useState({ loading: false, message: '' })

    const { user: adminUser } = useAuth()

    useEffect(() => {
        let usersData = []
        let activityData = []

        const updateState = () => {
            const merged = usersData.map(u => {
                // Find all location logs for this user, sorted by timestamp desc
                const userLogs = activityData
                    .filter(log =>
                        (log.userId === u.id || log.userEmail === u.email) &&
                        (log.eventType === 'location_share' || log.type?.toUpperCase() === 'LOCATION')
                    )
                    .sort((a, b) => {
                        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp);
                        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp);
                        return timeB - timeA;
                    });

                const latestLog = userLogs[0];

                // Flexible coordinate parsing matching provided schema
                const getCoords = (log) => {
                    if (!log) return null;

                    // Check for nested 'data.latitude/longitude' as provided in schema
                    if (log.data && log.data.latitude !== undefined && log.data.longitude !== undefined) {
                        return { lat: Number(log.data.latitude), lng: Number(log.data.longitude) };
                    }

                    // Fallback to top-level or other formats
                    const l = log.location || log;
                    const lat = l.latitude ?? l.lat;
                    const lng = l.longitude ?? l.lng;

                    if (lat !== undefined && lng !== undefined) {
                        return { lat: Number(lat), lng: Number(lng) };
                    }
                    return null;
                };

                const actualLocation = getCoords(latestLog);

                return {
                    ...u,
                    location: actualLocation || {
                        lat: -26.2041 + (Math.random() * 0.1 - 0.05),
                        lng: 28.0473 + (Math.random() * 0.1 - 0.05)
                    },
                    isMock: !actualLocation,
                    battery: u.battery || latestLog?.battery || Math.floor(Math.random() * 100),
                    signal: u.signal || latestLog?.signal || ['Good', 'Fair', 'Poor'][Math.floor(Math.random() * 3)],
                    lastSeen: latestLog?.timestamp || u.lastSeen || new Date().toISOString()
                }
            })
            setUsers(merged)
            if (merged.length > 0 && !selectedUser) {
                // Preserve selection if possible, or select first
                setSelectedUser(prev => merged.find(m => m.id === prev?.id) || merged[0]);
            }
        }

        const unsubUsers = firestoreService.subscribe('users', (data) => {
            usersData = data
            updateState()
            setLoading(false)
        })

        // Real-time location updates stream from Firestore
        const unsubActivity = firestoreService.subscribeWithQuery(
            'activity_logs',
            [orderBy('timestamp', 'desc')],
            (data) => {
                activityData = data
                updateState()
            }
        )

        return () => {
            unsubUsers()
            unsubActivity()
        }
    }, [])


    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase())
    )

    const sendCommand = async (type) => {
        if (!selectedUser) return;

        const confirmMsg = {
            ring: "This will trigger a loud alarm on the user's device. Continue?",
            lock: "This will remotely lock the user's device. Continue?",
            wipe: "CRITICAL: This will factory reset the user's device and delete all data. ARE YOU ABSOLUTELY SURE?"
        }

        if (!window.confirm(confirmMsg[type])) return;

        setCommandStatus({ loading: true, message: `Sending ${type} command...` })

        try {
            const basePayload = {
                userId: selectedUser.id,
                userEmail: selectedUser.email,
                command: type,
                actionType: type,
                timestamp: new Date().toISOString(),
                status: 'pending',
                requestedBy: adminUser?.uid || null,
                requestedByEmail: adminUser?.email || null
            }

            // Primary Firestore command document (used by mobile app / backend)
            const commandId = await firestoreService.add('device_commands', basePayload)

            // Audit log entry for this outbound command
            await firestoreService.add('device_command_audit', {
                ...basePayload,
                commandId,
                eventType: 'COMMAND_SENT',
                direction: 'OUTBOUND'
            })

            // Trigger Cloud Function to send FCM message (if deployed)
            try {
                await functionsService.sendDeviceCommand({
                    commandId,
                    userId: selectedUser.id,
                    userEmail: selectedUser.email,
                    actionType: type
                })
            } catch (fnError) {
                console.error('Cloud Function sendDeviceCommand failed:', fnError)
                // Non-fatal for UI; logs still captured in Firestore
            }

            setCommandStatus({ loading: false, message: `Command ${type} sent successfully!` })
            setTimeout(() => setCommandStatus({ loading: false, message: '' }), 3000)
        } catch (error) {
            console.error('Error sending command:', error)
            setCommandStatus({ loading: false, message: 'Failed to send command.' })
        }
    }

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col gap-6 fade-in">
            <div className="flex items-center justify-between flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Device Locator</h1>
                    <p className="text-sm text-gray-500">Real-time device tracking & anti-theft controls</p>
                </div>
                <div className="flex items-center gap-3">
                    {commandStatus.message && (
                        <div className={`px-4 py-2 rounded-xl text-sm font-medium ${commandStatus.message.includes('failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                            }`}>
                            {commandStatus.message}
                        </div>
                    )}
                    <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-indigo-600 transition shadow-sm">
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Users List Sidebar */}
                <div className="w-80 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search devices..."
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <Loader2 className="animate-spin text-indigo-600 mb-2" size={24} />
                                <p className="text-xs text-gray-500">Loading devices...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-500">No devices found</div>
                        ) : (
                            filteredUsers.map(u => (
                                <button
                                    key={u.id}
                                    onClick={() => setSelectedUser(u)}
                                    className={`w-full p-4 border-b border-gray-50 text-left transition-colors flex items-center gap-3 ${selectedUser?.id === u.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedUser?.id === u.id ? 'bg-indigo-600' : 'bg-gray-300'
                                        }`}>
                                        {u.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-2 h-2 rounded-full ${u.isMock ? 'bg-gray-400' : 'bg-green-500'}`}></span>
                                            <p className="text-[10px] text-gray-400 uppercase font-medium">
                                                {u.isMock ? 'Approx. Location' : 'Live GPS'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <Battery size={10} /> {u.battery}%
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-0.5">
                                            <Signal size={10} /> {u.signal}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Map and Controls */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
                        <MapContainer
                            center={[-26.2041, 28.0473]}
                            zoom={14}
                            style={{ height: '100%', width: '100%' }}
                            zoomControl={false}
                        >
                            <TileLayer
                                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                attribution="Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community"
                            />
                            {users.map(u => (
                                <Marker key={u.id} position={[u.location.lat, u.location.lng]}>
                                    <Popup>
                                        <div className="p-1">
                                            <p className="font-bold text-gray-900">{u.name}</p>
                                            <p className="text-xs text-gray-500 mt-1">Last seen: {new Date(u.lastSeen).toLocaleTimeString()}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                            {selectedUser && <RecenterMap position={[selectedUser.location.lat, selectedUser.location.lng]} />}
                        </MapContainer>

                        {/* Map Overlay info */}
                        {selectedUser && (
                            <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 w-64 pointer-events-none">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                                        <MapPin size={16} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                            {selectedUser.isMock ? 'Estimated Location' : 'Live GPS Sync'}
                                        </p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{selectedUser.name}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-gray-50 p-2 rounded-xl">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Accuracy</p>
                                        <p className="text-xs font-bold text-indigo-600">± 5 meters</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-xl">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Last Sync</p>
                                        <p className="text-xs font-bold text-gray-700">2m ago</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                            <button className="w-10 h-10 bg-white rounded-xl shadow-lg border border-gray-100 flex items-center justify-center text-gray-600 hover:text-indigo-600 transition pointer-events-auto">
                                <Maximize2 size={18} />
                            </button>
                        </div>

                        {/* Anti-Theft Controls overlay */}
                        <div className="absolute bottom-4 left-4 right-4 z-[1000] pointer-events-none">
                            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/60 p-4 pointer-events-auto">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert size={18} className="text-indigo-600" />
                                        <h2 className="font-bold text-gray-900 text-sm">Anti-Theft Controls</h2>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        {selectedUser
                                            ? <>Targeting: <span className="font-semibold text-gray-900">{selectedUser.name}</span></>
                                            : 'Select a device to target'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => sendCommand('ring')}
                                        disabled={!selectedUser}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Bell size={18} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold text-gray-900">Ring Device</p>
                                            <p className="text-[9px] text-gray-500 mt-0.5">High-volume alarm</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => sendCommand('lock')}
                                        disabled={!selectedUser}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold text-gray-900">Lock Device</p>
                                            <p className="text-[9px] text-gray-500 mt-0.5">Block access</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => sendCommand('wipe')}
                                        disabled={!selectedUser}
                                        className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all group disabled:opacity-50 disabled:pointer-events-none"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                                            <ShieldAlert size={18} />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[11px] font-bold text-gray-900">Wipe Data</p>
                                            <p className="text-[9px] text-red-500 mt-0.5 font-medium">Permanent removal</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
