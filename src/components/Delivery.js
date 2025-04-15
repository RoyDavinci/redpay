import React, { useEffect, useState } from "react";
import { Image } from "./Image";

export const Delivery = ({ paragraph, computeData }) => {
	const [updatedData, setUpdatedData] = useState([]);

	console.log(paragraph, computeData);

	// Function to determine color based on percentage for each category
	const getColorForDelivered = (percentage) => {
		if (percentage >= 98) return "bg-white";
		if (percentage >= 90) return "bg-amber-500";
		return "bg-red-500";
	};

	const getColorForPending = (percentage) => {
		if (percentage <= 2) return "bg-white";
		if (percentage <= 5) return "bg-amber-500";
		return "bg-red-500";
	};

	const getColorForRejected = getColorForPending;
	const getColorForUndelivered = getColorForPending;
	const getColorForExpired = getColorForPending;

	// Function to determine text color based on percentage
	const getTextColorForPercentage = (percentage) => {
		if (percentage >= 98) {
			return "text-black"; // Black text for white background
		} else if (percentage <= 1) {
			return "text-black"; // White text for non-white background
		} else {
			return "text-white";
		}
	};

	useEffect(() => {
		if (computeData.length === 8) {
			console.log("if");
			const filteredArray = computeData.filter(
				(item, index) => index % 2 === 0
			);
			setUpdatedData(filteredArray);
		} else if (computeData.length === 6) {
			console.log('else if"');
			// Define the indices to filter out (1, 2, 4, and 5)
			const indicesToFilter = [1, 2, 4, 5];

			// Use the filter method to filter out computeData at specific indices
			const filteredArray = computeData.filter(
				(item, index) => !indicesToFilter.includes(index)
			);
			setUpdatedData(filteredArray);
		} else {
			console.log("else");
			setUpdatedData(computeData);
		}
	}, [computeData, paragraph]);
	// console.log(paragraph, otp);
	return (
		<div>
			<div>
				<div className='grid lg:grid-cols-5 grid-cols-1 lg:gap-0 gap-10 items-center border border-solid border-gray-400'>
					<div className=''>
						<p className='my-0 text-gray-400 bg-gray-200 h-8 p-2 border border-solid border-gray-400'></p>
						<p className='my-0 h-10 p-2 border border-solid text-sm border-gray-400'>
							Delivered
						</p>
						<p className='my-0 h-10 p-2 border border-solid text-sm border-gray-400'>
							Undelivered
						</p>
						<p className='my-0 h-10 p-2 border border-solid text-sm border-gray-400'>
							Expired
						</p>
						<p className='my-0 h-10 p-2 border border-solid text-sm border-gray-400'>
							Rejected
						</p>
						<p className='my-0 h-10 p-2 border border-solid text-sm border-gray-400'>
							Sent/Pending
						</p>
					</div>
					{updatedData.map((item, index) => {
						// Calculate total and ensure it's valid
						let total;

						if (paragraph === "OTP") {
							const initialTotal =
								Number(item.issues) +
								Number(item.delivered) +
								Number(item.pending) +
								Number(item.undelivered) +
								Number(item.expired) +
								Number(item.rejected);
							console.log("initial", initialTotal);
							total = initialTotal; // Use ack + initialTotal for the total
						} else {
							total = Number(item.ack) + Number(item.issues);
						}
						console.log("Total:", total);

						// Ensure total is not zero to avoid division by zero
						if (total === 0) {
							return (
								<div key={item.name} className=''>
									<div className='font-bold text-sm h-8 p-2 border border-solid border-gray-400 flex items-center bg-gray-200'>
										<Image name={item.name} />
										<span className='ml-2'>{item.name}</span>
									</div>
									{/* Handle all statuses with 0% */}
									{[
										"delivered",
										"undelivered",
										"expired",
										"rejected",
										"pending",
									].map((status) => (
										<div
											key={status}
											className='border text-sm h-10 p-2 bg-gray-200 text-black'
										>
											0 (0%)
										</div>
									))}
								</div>
							);
						}

						// Function to calculate percentage
						const calculatePercentage = (value) => {
							const percentage = (Number(value) / total) * 100;
							return isNaN(percentage) ? 0 : percentage.toFixed(2);
						};

						const pending = Number(item.pending);

						// Function to determine color based on percentage for each category
						const getColorForDelivered = (percentage) => {
							if (percentage >= 98) return "bg-white";
							if (percentage >= 90) return "bg-amber-500";
							return "bg-red-500";
						};

						const getColorForPending = (percentage) => {
							if (percentage <= 2) return "bg-white";
							if (percentage <= 5) return "bg-amber-500";
							return "bg-red-500";
						};

						const getColorForRejected = getColorForPending;
						const getColorForUndelivered = getColorForPending;
						const getColorForExpired = getColorForPending;

						// Function to determine text color based on background color
						const getTextColor = (backgroundColorClass) => {
							return backgroundColorClass === "bg-white"
								? "text-black"
								: "text-white";
						};

						return (
							<div key={item.name} className=''>
								<div className='font-bold text-sm h-8 p-2 border border-solid border-gray-400 flex items-center bg-gray-200'>
									<Image name={item.name} />
									<span className='ml-2'>{item.name}</span>
								</div>
								<div
									className={`${getColorForDelivered(
										calculatePercentage(item.delivered)
									)} border text-sm h-10 p-2 ${getTextColor(
										getColorForDelivered(calculatePercentage(item.delivered))
									)}`}
								>
									{item.delivered} ({calculatePercentage(item.delivered)}%)
								</div>
								<div
									className={`${getColorForUndelivered(
										calculatePercentage(item.undelivered)
									)} border text-sm h-10 p-2 ${getTextColor(
										getColorForUndelivered(
											calculatePercentage(item.undelivered)
										)
									)}`}
								>
									{item.undelivered} ({calculatePercentage(item.undelivered)}%)
								</div>
								<div
									className={`${getColorForExpired(
										calculatePercentage(item.expired)
									)} border text-sm h-10 p-2 ${getTextColor(
										getColorForExpired(calculatePercentage(item.expired))
									)}`}
								>
									{item.expired} ({calculatePercentage(item.expired)}%)
								</div>
								<div
									className={`${getColorForRejected(
										calculatePercentage(item.rejected)
									)} border text-sm h-10 p-2 ${getTextColor(
										getColorForRejected(calculatePercentage(item.rejected))
									)}`}
								>
									{item.rejected} ({calculatePercentage(item.rejected)}%)
								</div>
								<div
									className={`${getColorForPending(
										calculatePercentage(pending)
									)} border text-sm h-10 p-2 ${getTextColor(
										getColorForPending(calculatePercentage(pending))
									)}`}
								>
									{pending} ({calculatePercentage(pending)}%)
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
