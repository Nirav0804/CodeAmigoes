// UserFetcherOnRouteChange.jsx
import { useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';

const UserFetcherOnRouteChange = () => {
    const location = useLocation();
    const { fetchUser } = useContext(AuthContext);

    useEffect(() => {
        fetchUser();
    }, [location.pathname]);

    return null;
};

export default UserFetcherOnRouteChange;
