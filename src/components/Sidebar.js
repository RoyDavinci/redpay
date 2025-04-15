import React from "react";

export const Sidebar = ({ setElement, logo, logout, element }) => {
	return (
		<div>
			<div className='bg-gray-900 text-white hidden h-full w-60  p-2 lg:flex flex-col items-center'>
				<div className='flex items-center space-x-2 mb-8'>
					<img src={logo} alt='Logo' className='w-20 h-20 rounded-full' />
				</div>
				<ul className='space-y-2'>
					<li
						className='hover:text-blue-500 cursor-pointer text-[14px]'
						onClick={() => setElement("Dashboard")}
					>
						<i className='fa-solid text-sm fa-bars mx-2 w-6 h-6'></i>Dashboard
					</li>
					<li
						className='hover:text-blue-500 cursor-pointer text-[14px]'
						onClick={() => setElement("Transactions")}
					>
						<i className='fa-solid text-sm fa-message mx-2 w-6 h-6'></i>
						Messages
					</li>
					<li
						className='hover:text-red-500 cursor-pointer text-[14px]'
						onClick={logout}
					>
						<i className='fa-solid text-sm fa-power-off mx-2 w-6 h-6'></i>Logout
					</li>
				</ul>
			</div>
		</div>
	);
};
