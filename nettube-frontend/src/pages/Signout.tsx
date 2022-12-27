function Signout() {
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  return (
    <>
      <p>You were succesfully logged out.</p>
    </>
  );
}

export default Signout;
