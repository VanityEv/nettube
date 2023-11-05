import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import useHttp from '../hooks/useHttp';

const ConfirmRegister = () => {
  const [searchParams] = useSearchParams();
  const { sendRequest } = useHttp();
  useEffect(() => {
    const sendConfirmRequest = async () => {
      const response = await sendRequest({
        method: 'POST',
        body: {
          token: searchParams.get('token'),
        },
        endpoint: '/user/confirmRegister',
      });
    };
    sendConfirmRequest();
  }, [searchParams, sendRequest]);

  return (
    <>
      <p>Your email has been confirmed!</p>
    </>
  );
};

export default ConfirmRegister;
