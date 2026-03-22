import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ children, allowedRoles }) {
    const { user, loading, isAuthenticated } = useAuth();
    
    if (loading) {
        return <div className="loader">Загрузка...</div>;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    if (!allowedRoles.includes(user?.role)) {
        return <Navigate to="/products" replace />;
    }
    
    return children;
}