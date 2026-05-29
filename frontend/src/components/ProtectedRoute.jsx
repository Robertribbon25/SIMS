import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // If no token, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return children;
}
