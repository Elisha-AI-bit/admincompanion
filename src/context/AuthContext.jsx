import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Demo admin user — replace with real Firebase Auth
const DEMO_USER = {
    uid: 'u1',
    name: 'Amara Nkosi',
    email: 'admin@mycompanion.app',
    role: 'super_admin',
    avatar: null,
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check localStorage for demo session
        const stored = localStorage.getItem('mc_admin_user')
        if (stored) {
            try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
        }
        setLoading(false)
    }, [])

    const login = (email, password) => {
        // Demo login — replace with Firebase signInWithEmailAndPassword
        if (email === 'admin@mycompanion.app' && password === 'admin123') {
            setUser(DEMO_USER)
            localStorage.setItem('mc_admin_user', JSON.stringify(DEMO_USER))
            return { success: true }
        }
        return { success: false, error: 'Invalid email or password.' }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('mc_admin_user')
    }

    const hasRole = (...roles) => user && roles.includes(user.role)

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within AuthProvider')
    return ctx
}
