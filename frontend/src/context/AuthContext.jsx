import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, googleProvider } from '../firebaseConfig';
import { 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen for Firebase Auth state changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            if (currentUser) {
                currentUser.getIdToken().then(token => {
                    localStorage.setItem('firebase_token', token);
                });
            } else {
                localStorage.removeItem('firebase_token');
            }
        });

        return () => unsubscribe();
    }, []);

    const login = async (email, password) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error("Login Error:", error);
            return { success: false, error: error.message };
        }
    };

    const signup = async (username, email, password) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            // Update profile with username
            await updateProfile(result.user, {
                displayName: username
            });
            return { success: true, user: result.user };
        } catch (error) {
            console.error("Signup Error:", error);
            return { success: false, error: error.message };
        }
    };

    const loginWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error("Google Sign-In Error:", error);
            return { success: false, error: error.message };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Logout Error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
