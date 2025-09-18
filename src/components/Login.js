import axios from "axios";
import React, { useEffect, useState } from "react";

export const Login = ({ loginState, setLoginState }) => {
	const [formData, setFormData] = useState({ username: "", password: "" });
	const [error, setError] = useState("");
	const [otp, setOtp] = useState(false);
	const [otpValue, setOtpValue] = useState("");

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleOtpSubmit = async (e) => {
		e.preventDefault();
		// setLoginState(false);

		try {
			console.log(otpValue);
			const { data } = await axios.post(
				"https://messaging.approot.ng/newportal/otp.php",
				{
					otp: otpValue,
					username: formData.username,
				}
			);
			console.log(data);
			if (data.status === "200") {
				console.log(data);
				const token = sessionStorage.getItem("token");
				localStorage.setItem("token", token);
				localStorage.setItem("username", formData.username);
				setError("");
				setLoginState(false);

				// Login successful, redirect to the dashboard or set authentication state
			} else {
				setError(data.error);
			}
		} catch (error) {
			console.log(error);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		try {
			const { data } = await axios.post(
				"https://messaging.approot.ng/newportal/login.php",
				{
					...formData,
				}
			);

			console.log(data);

			if (data.status === "200") {
				sessionStorage.setItem("token", data.token);
				setError("");
				setOtp(true);

				// Login successful, redirect to the dashboard or set authentication state
			} else {
				setError(data.error);
			}
		} catch (error) {
			setError("An error occurred. Please try again.");
			setLoginState(true);
		}
	};

	useEffect(() => {
		const checkLocalstorage = localStorage.getItem("token");
		if (checkLocalstorage) {
			setLoginState(false);
		} else {
			return;
		}
	}, []);

	return (
		<div className='min-h-screen flex items-center justify-center bg-gray-400'>
			{otp ? (
				<form
					className='bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-1/3'
					onSubmit={handleOtpSubmit}
				>
					<h2 className='text-white text-2xl font-bold mb-4 text-center bg-[#D82418] py-2 rounded-t-lg'>
						RedPay SMS Dashboard
					</h2>
					<div className='mb-4'>
						<label
							className='block text-gray-700 text-sm font-bold mb-2'
							htmlFor='otp'
						>
							OTP
						</label>
						<input
							className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
							id='otp'
							type='number'
							name='otp'
							placeholder='OTP'
							value={otpValue}
							onChange={(e) => {
								setOtpValue(e.target.value);
							}}
							required
						/>
					</div>
					<div className='flex items-center justify-between'>
						<button
							className='bg-[#D82418] hover:bg-[#D82418] text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline'
							type='submit'
						>
							Proceed
						</button>
					</div>
					{error && (
						<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mt-2 text-center'>
							{error}
						</div>
					)}
				</form>
			) : (
				<form
					className='bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-1/3'
					onSubmit={handleSubmit}
				>
					<h2 className='text-white text-2xl font-bold mb-4 text-center bg-[#D82418] py-2 rounded-t-lg'>
						Redpay SMS Dashboard
					</h2>
					<div className='mb-4'>
						<label
							className='block text-gray-700 text-sm font-bold mb-2'
							htmlFor='username'
						>
							Username
						</label>
						<input
							className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
							id='username'
							type='text'
							name='username'
							placeholder='Username'
							value={formData.username}
							onChange={handleChange}
							required
						/>
					</div>
					<div className='mb-6'>
						<label
							className='block text-gray-700 text-sm font-bold mb-2'
							htmlFor='password'
						>
							Password
						</label>
						<input
							className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
							id='password'
							type='password'
							name='password'
							placeholder='Password'
							value={formData.password}
							onChange={handleChange}
							autoComplete='no-password'
							required
						/>
					</div>
					<div className='flex items-center justify-between'>
						<button
							className='bg-[#D82418] hover:bg-[#D82418] text-white font-bold py-2 px-4 rounded w-full focus:outline-none focus:shadow-outline'
							type='submit'
						>
							Login
						</button>
					</div>
					{error && (
						<div className='bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-md mt-2 text-center'>
							{error}
						</div>
					)}
				</form>
			)}
		</div>
	);
};
