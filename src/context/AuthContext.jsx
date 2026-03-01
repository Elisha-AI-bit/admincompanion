import { createContext, useContext, useState, useEffect } from 'react'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            try {
                if (firebaseUser) {
                    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
                    if (userDoc.exists()) {
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            ...userDoc.data()
                        })
                    } else {
                        setUser({
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: 'user'
                        })
                    }
                } else {
                    setUser(null)
                }
            } catch (err) {
                console.error('Error fetching user profile:', err)
                if (firebaseUser) {
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        role: 'user'
                    })
                } else {
                    setUser(null)
                }
            } finally {
                setLoading(false)
            }
        })

        return () => unsubscribe()
    }, [])

    const login = async (email, password) => {
        try {
            // Prevent ProtectedRoute from redirecting back to /login
            // while Firebase is still establishing the new session.
            setLoading(true)
            await signInWithEmailAndPassword(auth, email, password)
            return { success: true }
        } catch (error) {
            console.error('Login error:', error)
            let message = 'An error occurred during login.'
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                message = 'Invalid email or password.'
            }
            // If login fails, stop the loading state so the form is usable again.
            setLoading(false)
            return { success: false, error: message }
        }
    }

    const logout = async () => {
        try {
            await signOut(auth)
        } catch (error) {
            console.error('Logout error:', error)
        }
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
