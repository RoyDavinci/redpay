import React from "react";
import mtn from "../assets/mtn.png";
import glo from "../assets/glo.png";
import etisalat from "../assets/etisalat.jpeg";
import airtel from "../assets/airtel.png";

export const Image = ({ name }) => {
	const imageToDisplay = (name) => {
		if (name.toLowerCase() === "mtn") {
			return (
				<div className='w-6 h-6'>
					<img src={mtn} alt='mtn' className=' rounded-full   ' />
				</div>
			);
		} else if (name.toLowerCase() === "airtel") {
			return (
				<div className='w-6 h-6'>
					<img
						alt='airtel'
						src={airtel}
						className=' rounded-full w-full h-full  '
					></img>
				</div>
			);
		} else if (
			name.toLowerCase() === "glo" ||
			name.toLowerCase() === "globacom"
		) {
			return (
				<div className='w-6 h-6'>
					<img
						alt='glo'
						src={glo}
						className='rounded-full w-full h-full '
					></img>
				</div>
			);
		}
		return (
			<div className='w-6 h-6'>
				<img src={etisalat} alt='9mobile' className='rounded-full   ' />
			</div>
		);
	};
	return <div>{imageToDisplay(name)}</div>;
};
