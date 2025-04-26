/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from "react";
import { Delivery } from "./Delivery";
import FadeLoader from "react-spinners/FadeLoader";

const options = {
	year: "numeric",
	month: "long",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
	hour12: false,
};

export const Design = ({ items, loading }) => {
	const [activeIndex, setActiveIndex] = useState(0);
	const [computeData, setComputeData] = useState([]);
	const [totalValue, setTotalValue] = useState(0);
	const [data, setData] = useState([
		{ delivered: 0, deliveredPercentage: "0%" },
		{ undelivered: 0, undeliveredPercentage: "0%" },
		{ enroute: 0, enroutePercentage: "0%" },
		{ expired: 0, expiredPercentage: "0%" },
		{ unknown: 0, unknownPercentage: "0%" },
	]);
	const [totalSms, setTotalSms] = useState(0);

	const paragraphs = ["All Messages"];

	const handleParagraphClick = (index) => {
		setActiveIndex(index);
	};

	const override = {
		display: "block",
		margin: "0 auto",
	};

	const runComputation = useCallback((item) => {
		const total = {
			delivered: 0,
			undelivered: 0,
			pending: 0,
			expired: 0,
			unknown: 0,
		};

		item.forEach((networkData) => {
			total.delivered += Number(networkData.delivered);
			total.undelivered += Number(networkData.undelivered);
			total.pending += Number(networkData.pending);
			total.expired += Number(networkData.expired);
			total.unknown += Number(networkData.issues);
		});

		let sms = 0;
		item.forEach((networkData) => {
			sms +=
				Number(networkData.ack) +
				Number(networkData.issues) +
				Number(networkData.pending) +
				Number(networkData.delivered) +
				Number(networkData.undelivered) +
				Number(networkData.expired);
		});

		setTotalSms(sms);

		let valued = 0;
		item.forEach((networkData) => {
			valued +=
				Number(networkData.ack) +
				Number(networkData.issues) +
				Number(networkData.delivered) +
				Number(networkData.undelivered) +
				Number(networkData.expired);
		});
		const totalSum = Object.values(total).reduce((acc, val) => acc + val, 0);
		setTotalValue(valued);

		const percentage = (count) =>
			totalSum > 0 ? `${((count / totalSum) * 100).toFixed(2)}%` : "0%";

		const updatedData = [
			{
				delivered: total.delivered,
				deliveredPercentage: percentage(total.delivered),
			},
			{
				undelivered: total.undelivered,
				undeliveredPercentage: percentage(total.undelivered),
			},
			{
				enroute: total.pending,
				enroutePercentage: percentage(total.pending),
			},
			{
				expired: total.expired,
				expiredPercentage: percentage(total.expired),
			},
			{
				unknown: total.unknown,
				unknownPercentage: percentage(total.unknown),
			},
		];

		setData(updatedData);
	}, []);

	useEffect(() => {
		setComputeData(items);
		runComputation(items);
	}, [activeIndex, runComputation, items]);

	return (
		<div>
			{loading ? (
				<div className='flex justify-center items-center flex-col h-screen'>
					<FadeLoader
						loading={loading}
						cssOverride={override}
						size={300}
						aria-label='Loading Spinner'
						data-testid='loader'
					/>
				</div>
			) : (
				<main>
					<header className='flex justify-between items-center mb-4'>
						<div className='font-sm text-md'>
							<p className='lg:text-xl text-md mb-1 font-bold'>
								Detailed Insights
							</p>
							<p className='lg:text-md text-xs lg:w-full w-60'>
								Last Updated on {new Date().toLocaleString("en-US", options)}
							</p>
						</div>
					</header>

					<section className='mb-6'>
						<div className='flex border-b border-solid border-gray-300 justify-normal h-8'>
							{paragraphs.map((paragraph, index) => (
								<p
									key={index}
									className={`cursor-pointer pb-[30.2px] mx-2 ${
										index === activeIndex
											? "border-green-500 border-b-4 border-solid rounded-sm"
											: ""
									}`}
									onClick={() => handleParagraphClick(index)}
								>
									{paragraph}
								</p>
							))}
						</div>
					</section>

					<section className='border mb-6 border-solid border-gray-400 rounded-sm p-4'>
						<div className='flex justify-between items-center'>
							<div>
								<p className='font-bold'>Delivery Ratio</p>
								<p className='text-gray-400'>Total SMS Sent - {totalSms}</p>
							</div>
							<div>
								<p>Traffic Volume</p>
								<span className='text-gray-400'>
									PendingDLR - {Math.abs(Number(totalSms) - Number(totalValue))}
								</span>
							</div>
						</div>

						<div className='w-full h-6 flex mt-2'>
							{data.map((categoryData, index) => {
								const key = Object.keys(categoryData)[0];
								const value = categoryData[key];
								const widthPercentage =
									totalValue === 0 ? 25 : (value / totalValue) * 100;

								return (
									<div
										key={index}
										className={`flex-grow ${
											key === "delivered"
												? "bg-green-800"
												: key === "undelivered"
												? "bg-blue-500"
												: key === "expired"
												? "bg-yellow-500"
												: key === "unknown"
												? "bg-[#654321CC]"
												: "bg-red-500"
										} rounded-sm mx-[1.5px]`}
										style={{ width: `${widthPercentage}%` }}
									></div>
								);
							})}
						</div>

						<div className='lg:flex grid grid-cols-2 justify-between items-center my-4'>
							{data.map((item, index) => {
								const key = Object.keys(item)[0];
								const value = item[key];
								const percentage =
									totalValue === 0
										? 0
										: ((value / totalValue) * 100).toFixed(1);

								return (
									<div key={index}>
										<p className='uppercase my-0 lg:text-sm text-xs'>
											{key.toLowerCase() === "pending" ? "ENROUTE" : key} :{" "}
											{percentage}%
										</p>
										<p className='flex items-center'>
											<span
												className={`inline-block h-4 w-4 rounded-sm ${
													key === "delivered"
														? "bg-green-700"
														: key === "undelivered"
														? "bg-blue-500"
														: key === "expired"
														? "bg-yellow-500"
														: key === "unknown"
														? "bg-[#654321CC]"
														: "bg-red-500"
												}`}
											></span>
											<span className='inline-block ml-2 text-sm'>{value}</span>
										</p>
									</div>
								);
							})}
						</div>
					</section>

					<section className='my-6'>
						<div className='flex justify-between my-4 items-center'>
							<p className='my-0'>Delivery Rate By Networks</p>
							<p className='my-0'>Chart View</p>
						</div>
						<Delivery
							paragraph={paragraphs[activeIndex]}
							computeData={computeData}
						/>
					</section>
				</main>
			)}
		</div>
	);
};
