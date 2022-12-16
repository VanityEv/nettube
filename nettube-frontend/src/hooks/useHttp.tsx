import { useState, useCallback } from "react";
import { SERVER_ADDR, SERVER_PORT } from "../constants";

type RequestSignupConfig = {
	body: object;
	method: "GET" | "POST";
	endpoint: string;
};

const useHttp = () => {
	const [error, setError] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	const sendRequest = useCallback(async (requestConfig: RequestSignupConfig) => {
		setIsLoading(true);
		setError(null);
		console.log(SERVER_ADDR + ":" + SERVER_PORT + requestConfig.endpoint);
		try {
			const response = await fetch(
				SERVER_ADDR + ":" + SERVER_PORT + requestConfig.endpoint,
				requestConfig.body
					? {
							method: requestConfig.method,
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify(requestConfig.body),
					  }
					: {}
			);

			if (!response.ok) {
				throw new Error("Request failed!");
			}

			return await response.json();
		} catch (err: any) {
			setError(err.message || "Something went wrong!");
		}
		setIsLoading(false);
	}, []);
	return { isLoading, error, sendRequest };
};
export default useHttp;
