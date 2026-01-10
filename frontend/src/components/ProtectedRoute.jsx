import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    // Authentication bypassed for public access
    return children;
};

export default ProtectedRoute;
