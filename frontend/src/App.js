import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Splits from './pages/splits';
import AIChat from './pages/AIChat';
import Profile from './pages/profile';
import Goals from './pages/Goals';
import Friends from './pages/Friends';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/transactions" element={
            <ProtectedRoute><Transactions /></ProtectedRoute>
          } />
              <Route path="/budgets" element={
            <ProtectedRoute><Budgets /></ProtectedRoute>
          } />
          <Route path="/splits" element={
            <ProtectedRoute><Splits /></ProtectedRoute>
          } />
          <Route path="/ai" element={
  <ProtectedRoute><AIChat /></ProtectedRoute>
} />
<Route path="/profile" element={
  <ProtectedRoute><Profile /></ProtectedRoute>
} />
<Route path="/goals" element={
  <ProtectedRoute><Goals /></ProtectedRoute>
} />
<Route path="/friends" element={
  <ProtectedRoute><Friends /></ProtectedRoute>
} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;