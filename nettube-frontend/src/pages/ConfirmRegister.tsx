import ResponsiveAppBar from "../components/ResponsiveAppBar";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import useHttp from "../hooks/useHttp";

const ConfirmRegister = () => {
	const [searchParams] = useSearchParams();
	const { sendRequest } = useHttp();
	useEffect(() => {
		const sendConfirmRequest = async () => {
			console.log("request sent");
			const response = await sendRequest({
				method: "POST",
				body: {
					token: searchParams.get("token"),
				},
				endpoint: "/user/confirmRegister",
			});
			console.log(response);
		};
		sendConfirmRequest();
		console.log(searchParams.get("token"));
	}, [searchParams, sendRequest]);
	return (
		<>
			<ResponsiveAppBar />
			<p>Your email has been confirmed!</p>
		</>
	);
};

export default ConfirmRegister;
