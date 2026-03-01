import { useState, useEffect, useRef, useMemo } from 'react'
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

// Zambia default center (Lusaka) - all devices are in Zambia
const ZAMBIA_CENTER = [-15.3875, 28.3228];

// Deterministic pseudo-random number from a string seed (avoids random jumps on re-render)
function seededRandom(seed, index = 0) {
    let h = 0;
    const str = String(seed) + String(index);
    for (let i = 0; i < str.length; i++) {
        h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return ((h >>> 0) / 0xFFFFFFFF);
}

// Format coordinate pair into a readable string
function formatCoords(lat, lng) {
    const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
    const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
    return `${latStr}, ${lngStr}`
}

// Reverse geocode lat/lng to a place name via Nominatim
// Returns a place name string, or null if it fails (caller should keep showing coords)
async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'MyCompanion-Admin/1.0' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (data?.error) return null; // Nominatim returns {error: 'Unable to geocode'} for bad coords
        if (data?.address) {
            const a = data.address;
            const parts = [
                a.road, a.suburb, a.neighbourhood, a.village, a.town, a.city, a.state, a.country
            ].filter(Boolean);
            if (parts.length > 0) return parts.join(', ');
        }
        return data?.display_name || null;
    } catch {
        return null;
    }
}

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

// Format a Firestore timestamp or ISO string into a human-readable relative time
function formatLastSeen(ts) {
    if (!ts) return 'Unknown';
    let date;
    if (ts?.seconds) date = new Date(ts.seconds * 1000);
    else date = new Date(ts);
    if (isNaN(date)) return 'Unknown';
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
}

export default function DeviceLocatorPage() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedUserId, setSelectedUserId] = useState(null)
    const [commandStatus, setCommandStatus] = useState({ loading: false, message: '' })
    const [locationNames, setLocationNames] = useState({})

    // Ref so the subscriptions closure can always read the current selectedUserId
    const selectedUserIdRef = useRef(null)
    useEffect(() => { selectedUserIdRef.current = selectedUserId }, [selectedUserId])

    // Refs for sidebar scroll-to-selected behaviour
    const sidebarListRef = useRef(null)
    const selectedItemRef = useRef(null)
    useEffect(() => {
        if (selectedItemRef.current && sidebarListRef.current) {
            selectedItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
    }, [selectedUserId])

    const { user: adminUser } = useAuth()

    // Derive the full selected user object from the ID
    const selectedUser = useMemo(() => users.find(u => u.id === selectedUserId) || null, [users, selectedUserId])

    useEffect(() => {
        let usersData = []
        let locationData = []

        const updateState = () => {
            const merged = usersData.map(u => {
                // Find all location docs for this user, sorted by timestamp desc
                // Match on userId (Firebase UID stored in the location collection)
                const userLocs = locationData
                    .filter(loc => loc.userId === u.id)
                    .sort((a, b) => {
                        const timeA = a.timestamp?.seconds ? a.timestamp.seconds * 1000 : new Date(a.timestamp);
                        const timeB = b.timestamp?.seconds ? b.timestamp.seconds * 1000 : new Date(b.timestamp);
                        return timeB - timeA;
                    });

                const latest = userLocs[0];

                // Schema: { lat, lng, userId, timestamp, accuracy }
                const actualLocation = (latest?.lat !== undefined && latest?.lng !== undefined)
                    ? { lat: Number(latest.lat), lng: Number(latest.lng) }
                    : null;

                const userName = u.name || u.displayName || u.email?.split('@')[0] || 'Unknown';

                return {
                    ...u,
                    name: userName,
                    location: actualLocation || {
                        lat: ZAMBIA_CENTER[0] + (seededRandom(u.id, 0) * 0.1 - 0.05),
                        lng: ZAMBIA_CENTER[1] + (seededRandom(u.id, 1) * 0.1 - 0.05)
                    },
                    isMock: !actualLocation,
                    accuracy: latest?.accuracy || null,
                    battery: u.battery || Math.floor(seededRandom(u.id, 2) * 100),
                    signal: u.signal || ['Good', 'Fair', 'Poor'][Math.floor(seededRandom(u.id, 3) * 3)],
                    lastSeen: latest?.timestamp || u.lastSeen || null
                }
            })
            setUsers(merged)
            const current = selectedUserIdRef.current
            if (merged.length > 0 && !current) {
                setSelectedUserId(merged[0].id)
            } else if (merged.length > 0 && current && !merged.find(m => m.id === current)) {
                setSelectedUserId(merged[0].id)
            }
        }

        const unsubUsers = firestoreService.subscribe('users', (data) => {
            usersData = data
            updateState()
            setLoading(false)
        })

        // Real-time stream from the 'location' collection
        const unsubLocation = firestoreService.subscribeWithQuery(
            'location',
            [orderBy('timestamp', 'desc')],
            (data) => {
                locationData = data
                updateState()
            }
        )

        return () => {
            unsubUsers()
            unsubLocation()
        }
    }, [])

    // Geocode in background: mark as pending immediately, then resolve to place name
    useEffect(() => {
        let cancelled = false

        const usersNeedingGeocode = users.filter(u =>
            !u.isMock &&
            !locationNames[u.id]  // not yet fetched at all
        )

        if (usersNeedingGeocode.length === 0) return

        // Mark all pending immediately so UI shows 'Fetching...'
        setLocationNames(prev => {
            const updates = {}
            usersNeedingGeocode.forEach(u => {
                if (!prev[u.id]) updates[u.id] = { type: 'pending' }
            })
            return { ...prev, ...updates }
        })

        // Fire all requests with a small stagger (200ms apart) to avoid hammering Nominatim
        usersNeedingGeocode.forEach((u, i) => {
            setTimeout(async () => {
                if (cancelled) return
                const name = await reverseGeocode(u.location.lat, u.location.lng)
                if (!cancelled) {
                    setLocationNames(prev => ({
                        ...prev,
                        [u.id]: name
                            ? { type: 'place', value: name }
                            : { type: 'coords', value: formatCoords(u.location.lat, u.location.lng) }
                    }))
                }
            }, i * 300)
        })

        return () => { cancelled = true }
    }, [users])

    // Returns the location label to display in the sidebar/popup
    const getLocationName = (u) => {
        if (!u) return null
        const cached = locationNames[u.id]
        if (!cached) return null                              // real GPS but not yet started
        if (cached.type === 'pending') return 'Fetching location…'
        if (cached.type === 'place') return cached.value     // e.g. 'Lusaka, Zambia'
        if (cached.type === 'coords') return cached.value    // formatted coords as last resort
        return null
    }

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
        <div className="min-h-[calc(100vh-120px)] h-auto lg:h-[calc(100vh-120px)] flex flex-col gap-4 sm:gap-6 fade-in overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0 px-1">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Device Locator</h1>
                    <p className="text-xs sm:text-sm text-gray-500">Real-time device tracking & anti-theft controls</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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

                    <div className="flex-1 overflow-y-auto" ref={sidebarListRef}>
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
                                    ref={selectedUserId === u.id ? selectedItemRef : null}
                                    onClick={() => setSelectedUserId(u.id)}
                                    className={`w-full p-4 border-b border-gray-50 text-left transition-colors flex items-center gap-3 ${selectedUserId === u.id ? 'bg-indigo-50/50' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${selectedUserId === u.id ? 'bg-indigo-600' : 'bg-gray-300'
                                        }`}>
                                        {u.name?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.isMock ? 'bg-gray-400' : 'bg-green-500'}`}></span>
                                            <p className="text-[10px] text-gray-500 truncate" title={getLocationName(u) || undefined}>
                                                {getLocationName(u) || (u.isMock ? 'Approx. Location' : 'Live GPS')}
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
                <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-w-0 min-h-[320px] lg:min-h-0">
                    <div className="flex-1 min-h-[320px] sm:min-h-[400px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
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
                                <Marker
                                    key={u.id}
                                    position={[u.location.lat, u.location.lng]}
                                    eventHandlers={{ click: () => setSelectedUserId(u.id) }}
                                >
                                    <Popup>
                                        <div className="p-2 min-w-[200px]">
                                            <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{u.email}</p>
                                            {getLocationName(u) && (
                                                <p className="text-xs text-gray-600 mt-2 flex items-start gap-1">
                                                    <MapPin size={12} className="flex-shrink-0 mt-0.5" />
                                                    <span>{getLocationName(u)}</span>
                                                </p>
                                            )}
                                            <div className="flex gap-3 mt-2 text-[11px] text-gray-500">
                                                <span>Battery: {u.battery}%</span>
                                                <span>Signal: {u.signal}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-1">Last seen: {formatLastSeen(u.lastSeen)}</p>
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
                                        <p className="text-xs font-bold text-indigo-600">
                                            {selectedUser.accuracy ? `± ${selectedUser.accuracy}m` : '± --'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-xl">
                                        <p className="text-[9px] text-gray-400 font-bold uppercase">Last Seen</p>
                                        <p className="text-xs font-bold text-gray-700">{formatLastSeen(selectedUser.lastSeen)}</p>
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
                        <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-[1000] pointer-events-none">
                            <div className="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl border border-white/60 p-3 sm:p-4 pointer-events-auto">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <ShieldAlert size={18} className="text-indigo-600 flex-shrink-0" />
                                        <h2 className="font-bold text-gray-900 text-sm">Anti-Theft Controls</h2>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {selectedUser
                                            ? <>Targeting: <span className="font-semibold text-gray-900">{selectedUser.name}</span></>
                                            : 'Select a device to target'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
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
