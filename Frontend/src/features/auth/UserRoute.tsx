import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from './authSlice';

const UserRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ redirectTo: location.pathname }} />;
  }

  if (user?.role === 'Admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default UserRoute;
