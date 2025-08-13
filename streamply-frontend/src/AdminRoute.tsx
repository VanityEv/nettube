import { Navigate } from 'react-router-dom';
import { getCookie } from 'typescript-cookie';
import { jwtDecode } from 'jwt-decode';

export type AdminRouteProps = {
  isAuthenticated: boolean;
  authenticationPath: string;
  outlet: JSX.Element;
};

export default function AdminRoute({ isAuthenticated, authenticationPath, outlet }: AdminRouteProps) {
  // First check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={{ pathname: authenticationPath }} />;
  }

  // Check if user has admin privileges
  try {
    const token = getCookie('userToken');
    if (!token) {
      return <Navigate to={{ pathname: '/' }} />;
    }

    const decoded: any = jwtDecode(token);
    const accountType = decoded.account_type;

    // Only allow admin (type 3) and moderator (type 2) access
    if (accountType !== 2 && accountType !== 3) {
      console.warn('🚫 ACCESS DENIED - User attempted to access admin dashboard without privileges');
      console.warn('Current account type:', accountType, '(need type 2 or 3)');
      return <Navigate to={{ pathname: '/' }} />;
    }

    console.log('✅ ADMIN ACCESS GRANTED - Account type:', accountType);
    return outlet;
  } catch (error) {
    console.error('❌ Error verifying admin privileges:', error);
    return <Navigate to={{ pathname: '/' }} />;
  }
}
