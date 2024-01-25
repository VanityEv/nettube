import { Navigate } from 'react-router-dom';
import { getCookie } from 'typescript-cookie';

export type ProtectedRouteProps = {
  authenticationPath: string;
  outlet: JSX.Element;
};

export default function ProtectedRoute({ authenticationPath, outlet }: ProtectedRouteProps) {
  if (!!getCookie('userToken')) {
    return outlet;
  } else {
    return <Navigate to={{ pathname: authenticationPath }} />;
  }
}
