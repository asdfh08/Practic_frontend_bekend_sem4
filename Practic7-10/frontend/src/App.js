import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProductsPage from "./pages/ProductsPage";
import UsersPage from "./pages/UsersPage";
import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import { AuthProvider } from "./context/AuthContext";
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route 
                    path="/products" 
                    element={
                        <PrivateRoute>
                            <ProductsPage />
                        </PrivateRoute>
                    } 
                />
                <Route 
                    path="/users" 
                    element={
                        <RoleRoute allowedRoles={['admin']}>
                            <UsersPage />
                        </RoleRoute>
                    } 
                />
                <Route path="*" element={<Navigate to="/products" replace />} />
            </Routes>
        </AuthProvider>
    );
}

export default App;