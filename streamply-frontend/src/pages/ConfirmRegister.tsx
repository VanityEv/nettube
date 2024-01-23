import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { api } from '../constants';
import axios from 'axios';

const ConfirmRegister = () => {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const sendConfirmRequest = async () => {
      const response = await axios.post(`${api}/user/confirmRegister`, searchParams.get('token'));
      sendConfirmRequest();
    };
  }, [searchParams]);

  return (
    <>
      <p>Your email has been confirmed!</p>
    </>
  );
};

export default ConfirmRegister;
