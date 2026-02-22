// Mock demo data — used while Firebase is not yet connected
// Replace with real Firestore queries after connecting Firebase

export const mockUsers = [
    { id: 'u1', name: 'Amara Nkosi', email: 'amara@example.com', role: 'super_admin', status: 'active', createdAt: '2025-10-01', lastActive: '2026-02-22' },
    { id: 'u2', name: 'Sipho Dlamini', email: 'sipho@example.com', role: 'moderator', status: 'active', createdAt: '2025-11-15', lastActive: '2026-02-21' },
    { id: 'u3', name: 'Thandi Mokoena', email: 'thandi@example.com', role: 'health_admin', status: 'active', createdAt: '2025-12-01', lastActive: '2026-02-20' },
    { id: 'u4', name: 'Lebo Sithole', email: 'lebo@example.com', role: 'cyber_admin', status: 'suspended', createdAt: '2025-09-20', lastActive: '2026-02-10' },
    { id: 'u5', name: 'Neo Khumalo', email: 'neo@example.com', role: 'health_admin', status: 'active', createdAt: '2026-01-05', lastActive: '2026-02-22' },
    { id: 'u6', name: 'Zara Patel', email: 'zara@example.com', role: 'moderator', status: 'active', createdAt: '2026-01-12', lastActive: '2026-02-19' },
    { id: 'u7', name: 'Kagiso Baloyi', email: 'kagiso@example.com', role: 'user', status: 'active', createdAt: '2026-02-01', lastActive: '2026-02-22' },
    { id: 'u8', name: 'Fatima Osman', email: 'fatima@example.com', role: 'user', status: 'suspended', createdAt: '2025-08-14', lastActive: '2025-12-30' },
]

export const mockEmergencyCalls = [
    { id: 'ec1', type: 'Police', timestamp: '2026-02-22T06:14:00', userId: 'u7', location: { lat: -26.2, lng: 28.04 }, responseTime: 2.1 },
    { id: 'ec2', type: 'Ambulance', timestamp: '2026-02-22T07:32:00', userId: 'u3', location: { lat: -26.21, lng: 28.05 }, responseTime: 3.5 },
    { id: 'ec3', type: 'Fire', timestamp: '2026-02-22T08:11:00', userId: 'u6', location: { lat: -26.19, lng: 28.03 }, responseTime: 4.2 },
    { id: 'ec4', type: 'GBV', timestamp: '2026-02-22T09:00:00', userId: 'u5', location: { lat: -26.2, lng: 28.06 }, responseTime: 1.8 },
    { id: 'ec5', type: 'Cyber', timestamp: '2026-02-22T10:22:00', userId: 'u2', location: { lat: -26.22, lng: 28.04 }, responseTime: 0.5 },
    { id: 'ec6', type: 'Police', timestamp: '2026-02-21T14:00:00', userId: 'u7', location: { lat: -26.2, lng: 28.04 }, responseTime: 2.8 },
    { id: 'ec7', type: 'Ambulance', timestamp: '2026-02-21T16:30:00', userId: 'u3', location: { lat: -26.21, lng: 28.05 }, responseTime: 3.1 },
    { id: 'ec8', type: 'Police', timestamp: '2026-02-20T11:00:00', userId: 'u6', location: { lat: -26.19, lng: 28.03 }, responseTime: 2.0 },
]

export const mockCallsTrend = [
    { day: 'Mon', Police: 12, Ambulance: 8, Fire: 3, GBV: 5, Cyber: 7 },
    { day: 'Tue', Police: 15, Ambulance: 10, Fire: 4, GBV: 6, Cyber: 9 },
    { day: 'Wed', Police: 9, Ambulance: 7, Fire: 2, GBV: 4, Cyber: 11 },
    { day: 'Thu', Police: 18, Ambulance: 11, Fire: 5, GBV: 8, Cyber: 6 },
    { day: 'Fri', Police: 21, Ambulance: 13, Fire: 6, GBV: 9, Cyber: 14 },
    { day: 'Sat', Police: 14, Ambulance: 9, Fire: 3, GBV: 7, Cyber: 8 },
    { day: 'Sun', Police: 10, Ambulance: 6, Fire: 2, GBV: 5, Cyber: 5 },
]

export const mockCyberRisk = [
    { name: 'SAFE', value: 58, color: '#10B981' },
    { name: 'CAUTION', value: 28, color: '#F59E0B' },
    { name: 'HIGH RISK', value: 14, color: '#DC2626' },
]

export const mockScamKeywords = [
    { keyword: 'SASSA Grant', count: 142 },
    { keyword: 'Bank OTP', count: 118 },
    { keyword: 'Lottery Winner', count: 97 },
    { keyword: 'Loan Approved', count: 85 },
    { keyword: 'Job Offer', count: 73 },
    { keyword: 'WhatsApp Hack', count: 61 },
]

export const mockScamReports = [
    { id: 'sr1', message: 'SASSA grant has been approved. Click link to claim your R1400…', riskLevel: 'HIGH RISK', timestamp: '2026-02-22T08:00:00', userId: 'u7' },
    { id: 'sr2', message: 'Your Capitec OTP is 482910. Never share this with anyone.', riskLevel: 'CAUTION', timestamp: '2026-02-22T09:15:00', userId: 'u5' },
    { id: 'sr3', message: 'Congratulations! You have won R50,000 in our MTN lottery!', riskLevel: 'HIGH RISK', timestamp: '2026-02-22T10:00:00', userId: 'u2' },
    { id: 'sr4', message: 'Your loan of R15,000 has been approved. Reply YES to confirm.', riskLevel: 'CAUTION', timestamp: '2026-02-21T14:00:00', userId: 'u6' },
    { id: 'sr5', message: 'Hi, I saw your CV online and have a job offer for you.', riskLevel: 'SAFE', timestamp: '2026-02-21T11:00:00', userId: 'u3' },
]

export const mockDoctors = [
    { id: 'd1', name: 'Dr. Precious Molefe', specialization: 'General Practitioner', phone: '+27 11 000 1111', rating: 4.8, availability: 'Mon-Fri' },
    { id: 'd2', name: 'Dr. James Okafor', specialization: 'Cardiologist', phone: '+27 11 000 2222', rating: 4.6, availability: 'Mon-Wed' },
    { id: 'd3', name: 'Dr. Sarah Naidoo', specialization: 'Paediatrician', phone: '+27 11 000 3333', rating: 4.9, availability: 'Tue-Sat' },
    { id: 'd4', name: 'Dr. Bongani Zulu', specialization: 'Emergency Medicine', phone: '+27 11 000 4444', rating: 4.7, availability: '24/7' },
]

export const mockStations = [
    { id: 'st1', name: 'Johannesburg Central Police', type: 'Police', phone: '011 375 5000', location: 'JHB CBD', rating: 4.2, status: 'Open' },
    { id: 'st2', name: 'Charlotte Maxeke Hospital', type: 'Hospital', phone: '011 488 3911', location: 'Parktown', rating: 4.5, status: 'Open' },
    { id: 'st3', name: 'Sandton Fire Station', type: 'Fire', phone: '011 375 5000', location: 'Sandton', rating: 4.0, status: 'Open' },
    { id: 'st4', name: 'Soweto Police Station', type: 'Police', phone: '011 982 5000', location: 'Soweto', rating: 3.8, status: 'Open' },
    { id: 'st5', name: 'Helen Joseph Hospital', type: 'Hospital', phone: '011 489 1011', location: 'Auckland Park', rating: 4.3, status: 'Closed' },
]

export const mockNews = [
    { id: 'n1', title: 'Rise in WhatsApp Phishing Scams Across SA', source: 'SABRIC', publishedAt: '2026-02-22', imageUrl: '', pinned: true },
    { id: 'n2', title: 'SAPS Launches Emergency App Integration', source: 'SAPS', publishedAt: '2026-02-21', imageUrl: '', pinned: false },
    { id: 'n3', title: 'Health Advisory: Cholera Outbreak in Limpopo', source: 'Dept of Health', publishedAt: '2026-02-20', imageUrl: '', pinned: true },
    { id: 'n4', title: 'New GBV Hotline Numbers Now Active', source: 'GBVF Council', publishedAt: '2026-02-19', imageUrl: '', pinned: false },
]

export const mockHotlines = [
    { service: 'Police', number: '10111', icon: '🚔' },
    { service: 'Ambulance', number: '10177', icon: '🚑' },
    { service: 'Fire', number: '10111', icon: '🚒' },
    { service: 'GBV Helpline', number: '0800 428 428', icon: '💜' },
    { service: 'Cyber Crime', number: '0800 023 999', icon: '🛡️' },
    { service: 'Child Support', number: '116', icon: '👶' },
]

export const mockHealthTrend = [
    { month: 'Sep', searches: 320 },
    { month: 'Oct', searches: 410 },
    { month: 'Nov', searches: 380 },
    { month: 'Dec', searches: 290 },
    { month: 'Jan', searches: 500 },
    { month: 'Feb', searches: 610 },
]

export const mockSymptoms = [
    { symptom: 'Chest Pain', count: 210 },
    { symptom: 'Fever', count: 185 },
    { symptom: 'Shortness of Breath', count: 162 },
    { symptom: 'Headache', count: 140 },
    { symptom: 'Abdominal Pain', count: 98 },
]
