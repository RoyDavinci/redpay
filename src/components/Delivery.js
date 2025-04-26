import React, { useEffect, useState } from "react";
import { Image } from "./Image";

export const Delivery = ({ paragraph, computeData }) => {
	const [updatedData, setUpdatedData] = useState([]);

	useEffect(() => {
		if (computeData.length === 8) {
			const filteredArray = computeData.filter((_, index) => index % 2 === 0);
			setUpdatedData(filteredArray);
		} else if (computeData.length === 6) {
			const indicesToFilter = [1, 2, 4, 5];
			const filteredArray = computeData.filter(
				(_, index) => !indicesToFilter.includes(index)
			);
			setUpdatedData(filteredArray);
		} else {
			setUpdatedData(computeData);
		}
	}, [computeData]);

	const calculateTotal = (item) => {
		return (
			Number(item.issues) +
			Number(item.delivered) +
			Number(item.pending) +
			Number(item.undelivered) +
			Number(item.expired) +
			Number(item.rejected)
		);
	};

	const calculatePercentage = (value, total) => {
		const percentage = (Number(value) / total) * 100;
		return isNaN(percentage) ? 0 : percentage.toFixed(2);
	};

	return (
		<div className='p-6'>
			<div className='grid lg:grid-cols-5 sm:grid-cols-2 grid-cols-1 gap-6 border rounded-2xl shadow-lg overflow-hidden bg-white'>
				{/* Static Left Column */}
				<div className='flex flex-col'>
					<div className='bg-gray-100 font-semibold text-center text-gray-600 py-2 border-b border-gray-300 text-sm'>
						Status
					</div>
					{[
						"Delivered",
						"Undelivered",
						"Expired",
						"Rejected",
						"Sent/Pending",
					].map((label) => (
						<div
							key={label}
							className='text-gray-700 py-3 px-4 border-b border-gray-200 text-sm flex items-center justify-center hover:bg-gray-50'
						>
							{label}
						</div>
					))}
				</div>

				{/* Dynamic Data Columns */}
				{updatedData.map((item) => {
					const total = calculateTotal(item);

					return (
						<div key={item.name} className='flex flex-col'>
							<div className='flex items-center justify-center gap-2 bg-gray-100 py-2 border-b border-gray-300 font-bold text-gray-700 text-sm'>
								<Image name={item.name} />
								<span>{item.name}</span>
							</div>

							{[
								{ key: "delivered", value: item.delivered },
								{ key: "undelivered", value: item.undelivered },
								{ key: "expired", value: item.expired },
								{ key: "rejected", value: item.rejected },
								{ key: "pending", value: item.pending },
							].map(({ key, value }) => {
								const percent =
									total > 0 ? calculatePercentage(value, total) : "0";

								return (
									<div
										key={key}
										className='text-gray-800 py-3 px-4 border-b border-gray-200 text-sm text-center hover:bg-gray-50'
									>
										{total === 0 ? "0 (0%)" : `${value} (${percent}%)`}
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
};
