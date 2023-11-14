import { SERVER_ADDR, SERVER_PORT } from '../constants';
import { AppDispatch } from '.';
import { UserCredentials } from './user.types';
import { userActions } from './user';

export const userLogin = (userCredentials: UserCredentials) => {
  return async (dispatch: AppDispatch) => {
    const fetchUser = async () => {
      dispatch(userActions.setIsSigning());
      const response = await fetch(SERVER_ADDR + ':' + SERVER_PORT + '/user/signin', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userCredentials,
        }),
      });
      if (response.status === 200) return await response.json();
      else
        dispatch(
          userActions.setUser({
            username: '',
            userToken: null,
          })
        );
    };
    try {
      const response = await fetchUser();
      if (response.result === 'SUCCESS') {
        const username = response.username;
        const userToken = response.token;
        const account_type = response.account_type.toString();
        localStorage.setItem('userToken', userToken);
        localStorage.setItem('username', username);
        localStorage.setItem('account_type', account_type);
        dispatch(
          userActions.setUser({
            username,
            token: userToken,
          })
        );
      }
    } catch (error) {}
  };
};
