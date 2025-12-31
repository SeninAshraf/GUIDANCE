
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const { currentUser } = useAuth();

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-700 max-w-md w-full">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">Access Restricted 🔒</h2>
                    <p className="text-gray-300 mb-6">
                        You need to be signed in to access this feature.
                    </p>
                    <Link
                        to="/"
                        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition transform hover:scale-105"
                    >
                        Go to Home & Sign In
                    </Link>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
