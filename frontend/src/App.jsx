import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SparePart from './pages/SparePart';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import Reports from './pages/Reports';

// Route guards
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Authentication Screen */}
        <Route path="/login" element={<Login />} />

        {/* Secure Dashboard View */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Secure Spare Part Insert & Read View */}
        <Route
          path="/spareparts"
          element={
            <ProtectedRoute>
              <SparePart />
            </ProtectedRoute>
          }
        />

        {/* Secure Stock In Restock View */}
        <Route
          path="/stockin"
          element={
            <ProtectedRoute>
              <StockIn />
            </ProtectedRoute>
          }
        />

        {/* Secure Stock Out CRUD View */}
        <Route
          path="/stockout"
          element={
            <ProtectedRoute>
              <StockOut />
            </ProtectedRoute>
          }
        />

        {/* Secure Reports View */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Fallback route - redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
