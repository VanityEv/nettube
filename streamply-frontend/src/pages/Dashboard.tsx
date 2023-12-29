import AdminTabs from '../components/AdminTabs';

function Dashboard() {
  // const sendUpdateQuery = async (param: string, value: string) => {
  //   const response = await sendRequest({
  //     method: 'POST',
  //     body: {
  //       param: param,
  //       value: value,
  //       username: localStorage.getItem('username'),
  //     },
  //     endpoint: '/user/updateUser',
  //   });
  //   if (response.result === 'success') {
  //     fetchUserProfileInfo();
  //   }
  // };

  return (
    <>
      <AdminTabs />
    </>
  );
}
export default Dashboard;
