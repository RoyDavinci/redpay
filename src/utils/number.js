export const getNetwork = (msisdn) => {
	// let number = "2348123456789";

	// Replace the prefix "234" with "0"
	if (typeof msisdn !== "string") {
		return "MTN";
	}
	const number = msisdn.replace(/^234/, "0");

	// Extract the first four characters from the modified number
	const prefix = number.substring(0, 4);
	// console.log(prefix);

	switch (prefix) {
		case "0701":
			return "Airtel";
		case "0702":
			return "MTN";
		case "07025":
			return "MTN";
		case "07026":
			return "MTN";
		case "07027":
			return "MTN";
		case "07028":
			return "MTN";
		case "07029":
			return "MTN";
		case "0703":
			return "MTN";
		case "0704":
			return "MTN";
		case "0705":
			return "Globacom";
		case "0706":
			return "MTN";
		case "0707":
			return "MTN";
		case "0708":
			return "Airtel";
		case "0709":
			return "MTN";
		case "0802":
			return "Airtel";
		case "0803":
			return "MTN";
		case "0804":
			return "Mtel";
		case "0805":
			return "Globacom";
		case "0806":
			return "MTN";
		case "0807":
			return "Globacom";
		case "0808":
			return "Airtel";
		case "0809":
			return "9mobile";
		case "0810":
			return "MTN";
		case "0811":
			return "Globacom";
		case "0812":
			return "Airtel";
		case "0813":
			return "MTN";
		case "0814":
			return "MTN";
		case "0815":
			return "Globacom";
		case "0906":
			return "MTN";
		case "0907":
			return "Airtel";
		case "0915":
			return "Globacom";
		case "0913":
			return "MTN";
		case "0912":
			return "Airtel";
		case "0916":
			return "MTN";
		case "0911":
			return "Airtel";
		default:
			return "MTN";
	}
};
