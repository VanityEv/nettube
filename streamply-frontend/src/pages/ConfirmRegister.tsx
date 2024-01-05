import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { SERVER_ADDR, SERVER_PORT } from '../constants';
import axios from 'axios';

const ConfirmRegister = () => {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const sendConfirmRequest = async () => {
      const response = await axios.post(
        `${SERVER_ADDR}:${SERVER_PORT}/user/confirmRegister`,
        searchParams.get('token')
      );
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
