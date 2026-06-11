import { Navigate, useLocation } from 'react-router-dom';

const LoginPage = () => {
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || new URLSearchParams(location.search).get('redirectTo') || '/';

  return <Navigate to={`/?auth=login&redirectTo=${encodeURIComponent(redirectTo)}`} replace />;
};

export default LoginPage;
