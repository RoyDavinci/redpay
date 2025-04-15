/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import FadeLoader from "react-spinners/FadeLoader";
import { getNetwork } from "../utils/number";
import { FaEye, FaSearch, FaDownload, FaPlus } from "react-icons/fa";
import { CSVLink } from "react-csv";

export const Transactions = () => {
	// const [data, setData] = useState([]); // Data state
	const [page, setPage] = useState(1); // Current page
	const rowsPerPage = 1000; // Number of rows per page
	const [dataItems, setDataItems] = useState([]);
	const [initialData, setinitialData] = useState([]);
	const [initialRenderedData, setinitialRenderedData] = useState([]);
	const [initialFilteredRenderedData, setinitialFilteredRenderedData] =
		useState([]);
	const [downloadButton, setDownloadButton] = useState(false);

	const [timeStamp, setTimeStamp] = useState({ from: "", to: "" });

	const [loading, setLoading] = useState(false);
	const [filterValue, setFilterValue] = useState("");
	const [phone, setPhone] = useState({ phone: "", from: "", to: "" });
	const [activeIndex, setActiveIndex] = useState(0);
	const [renderedData, setRenderedData] = useState("Transactional");
	const [status, setStatus] = useState("");
	const [telco, setTelco] = useState("");

	const errorCodeDescriptions = {
		"000": "Delivered",
		"0dc": "Absent Subscriber",
		206: "Absent Subscriber",
		"21b": "Absent Subscriber",
		"023": "Absent Subscriber",
		"027": "Absent Subscriber",
		"053": "Absent Subscriber",
		"054": "Absent Subscriber",
		"058": "Absent Subscriber",
		439: "Absent subscriber or ported subscriber or subscriber is barred",
		254: "Subscriber's phone inbox is full",
		220: "Subscriber's phone inbox is full",
		120: "Subscriber's phone inbox is full",
		"008": "Subscriber's phone inbox is full",
		255: "Invalid or inactive mobile number or subscriber's phone inbox is full",
		0: "Invalid or inactive mobile number or subscriber's phone inbox is full",
		"20b": "Invalid or inactive mobile number",
		"004": "Invalid or inactive mobile number",
		510: "Invalid or inactive mobile number",
		215: "Invalid or inactive mobile number",
		"20d": "Subscriber is barred on the network",
		130: "Subscriber is barred on the network",
		131: "Subscriber is barred on the network",
		222: "Network operator system failure",
		602: "Network operator system failure",
		306: "Network operator system failure",
		"032": "Network operator system failure or operator not supported",
		"085": "Subscriber is on DND",
		"065": "Message content or senderID is blocked on the promotional route",
		600: "Message content or senderID is blocked on the promotional route",
		"40a": "SenderID not whitelisted on the account",
		"082": "Network operator not supported",
		"00a": "SenderID is restricted by the operator",
		"078": "Restricted message content or senderID is blocked.",
		432: "Restricted message content or senderID is blocked.",
	};

	function isObject(obj) {
		if (obj) {
			let parsedObject = JSON.parse(obj);
			return (
				parsedObject !== undefined &&
				parsedObject !== null &&
				parsedObject.constructor == Object
			);
		} else {
			return false;
		}
	}

	const getErrorCodeDescription = (report) => {
		try {
			// If the report is a string and matches an error code directly
			if (
				typeof report === "string" &&
				errorCodeDescriptions[report] !== undefined
			) {
				return `${report}: ${errorCodeDescriptions[report]}`;
			}
			// If the report is a JSON object, try to parse and extract the error code
			else if (isObject(report)) {
				const parsedReport = JSON.parse(report);
				const message = parsedReport.message || "";

				// Extract error code using regex
				const errorCodeMatch = message.match(/err:([0-9a-zA-Z]+)/);
				if (errorCodeMatch) {
					const errorCode = errorCodeMatch[1];
					const description = errorCodeDescriptions[errorCode];
					return description ? `${errorCode}: ${description}` : errorCode;
				}
			}

			return "Awaiting DLR"; // Default fallback if no conditions match
		} catch (e) {
			console.error("Error in getErrorCodeDescription:", e);
			return "Awaiting DLR";
		}
	};

	// const [nonTransactional, setNonTransactional] = useState([]);

	const filterTable = async () => {
		setLoading(true);
		try {
			let formattedValue;

			if (filterValue.length === 11) {
				// If the value is 11 digits long, remove the first character and add "234" at the beginning
				formattedValue = "234" + filterValue.slice(1);
			} else if (filterValue.length === 13) {
				// If the value is 13 characters long, use the value as is
				formattedValue = filterValue;
			} else {
				// Handle cases where the value is not 11 or 13 characters long
				formattedValue = filterValue; // or any other default behavior
			}

			// First API Call
			const { data: portingData } = await axios.get(
				`https://ubasms.approot.ng/php/searchPorting.php?phone=${formattedValue}`
			);

			console.log("Porting Data:", portingData);

			// Validate portingData
			const validNetworks = ["MTN", "Airtel", "Glo", "9mobile"];
			const isValidNetwork = validNetworks.includes(portingData);

			// Second API Call
			const { data } = await axios.get(
				`https://ubasms.approot.ng/php/ubaPhoneSearch.php?phone=${formattedValue}`
			);

			console.log("Search Data (Before Update):", data);

			// Replace network field in all objects if portingData is valid
			const updatedData = data.map((item) => ({
				...item,
				network: isValidNetwork ? portingData : item.network,
			}));

			console.log("Search Data (After Update):", updatedData);

			// Sort and update state with the results
			const sortedData = updatedData.sort((a, b) => {
				const dateA = new Date(a.created_at);
				const dateB = new Date(b.created_at);
				return dateB - dateA;
			});

			setinitialData(sortedData);
			setinitialFilteredRenderedData(sortedData);
			setDownloadButton(true);

			setLoading(false);
			setPage(page + 1);
		} catch (error) {
			console.error("Error fetching data:", error);
			setLoading(false);
		}
	};

	const getDlrStatusDescription = (status) => {
		switch (status) {
			case "":
				return "Pending";
			case "DELIVRD":
				return "Delivered";
			case "EXPIRED":
				return "Expired";
			case "UNDELIV":
				return "Undelivered";
			case "REJECTD":
				return "Rejected";
			case null:
				return "Sent";
			default:
				return "Delivered"; // Default case if no match
		}
	};

	const transformDataForCSV = (data) => {
		console.log(data);

		return data.map((row) => ({
			msisdn: "'" + row.msisdn,
			network: getNetwork(row.msisdn), // Process the network
			senderid: row.senderid || "UBA", // Default to "UBA" if not present
			created_at: row.created_at,
			status: getDlrStatusDescription(row.dlr_status), // Get the status description
			error_code: getErrorCodeDescription(row.dlr_request), // Safely get error code description
			externalMessageId: window.crypto.randomUUID(),
			requestType: "SMS",
		}));
	};

	function formatTimestamp(date) {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
		const day = String(date.getDate()).padStart(2, "0");
		const hours = String(date.getHours()).padStart(2, "0");
		const minutes = String(date.getMinutes()).padStart(2, "0");
		const seconds = String(date.getSeconds()).padStart(2, "0");

		// return `${year}-${month}-${day}:${hours}:${minutes}`;
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	const handleTimestamp = (e) => {
		e.preventDefault();

		// Convert the form values to Date objects
		const fromDate = new Date(timeStamp.from);
		const toDate = new Date(timeStamp.to);

		// Filter the data based on the created_at field
		const filtered = initialFilteredRenderedData.filter((item) => {
			const itemDate = new Date(item.created_at);
			return itemDate >= fromDate && itemDate <= toDate;
		});

		// Sort the filtered data by date, descending
		const sortedFiltered = filtered.sort((a, b) => {
			const dateA = new Date(a.created_at);
			const dateB = new Date(b.created_at);
			return dateB - dateA;
		});

		// Update the state with the filtered and sorted data
		setinitialData(sortedFiltered);
	};

	const dbColumns = [
		{
			field: "id",
			headerName: "ID",
			type: "number",
			width: 90,
			headerAlign: "left",
			align: "left",
		},
		{
			field: "text",
			headerName: "Message",
			type: "number",
			width: 100,
			headerAlign: "left",
			align: "left",
		},
		{
			field: "msisdn",
			headerName: "Recipient",
			width: 100,
			headerAlign: "left",
			align: "left",
		},
		{
			field: "network",
			headerName: "Network",
			type: "number",
			width: 120,
			valueGetter: (params) => {
				const network = params?.row?.network?.toLowerCase();

				const knownNetworks = ["glo", "9mobile", "airtel"];

				if (
					!network ||
					(!knownNetworks.includes(network) && params?.row?.msisdn)
				) {
					return getNetwork(params?.row?.msisdn);
				} else {
					return params.row.network;
				}
			},
			headerAlign: "left",
			align: "left",
		},
		{
			field: "senderid",
			headerName: "Sender Id",
			width: 100,
			headerAlign: "left",
			align: "left",
			valueGetter: (params) =>
				params?.row && params?.row?.senderid
					? params?.row?.senderid
					: "Citizens",
		},
		{
			field: "created_at",
			headerName: "Date Time- Delivery Time",
			width: 200,
			headerAlign: "left",
			align: "left",
			// valueGetter: (params) => params.row.created_at
		},
		{
			field: "dlr_status",
			headerName: "Status",
			width: 200,
			headerAlign: "left",
			align: "left",
			renderCell: (params) => {
				if (params.row.dlr_status === "") {
					return (
						<p className='p-[0.5px] bg-yellow-300 text-yellow-400'>Pending</p>
					);
				} else if (params.row.dlr_status === "DELIVRD") {
					return (
						<p className='p-[1.5px] rounded-sm bg-green-500 text-white'>
							Delivered
						</p>
					);
				} else if (params.row.dlr_status === "EXPIRED") {
					return (
						<p className='p-[1.5px] bg-gray-300 rounded-sm text-black'>
							Expired
						</p>
					);
				} else if (params.row.dlr_status === "UNDELIV") {
					return (
						<p className='p-[1.5px] bg-gray-300 rounded-sm text-red-500'>
							Undelivered
						</p>
					);
				} else if (params.row.dlr_status === "REJECTD") {
					return (
						<p className='p-[1.5px] bg-red-500 rounded-sm text-white'>
							Rejected
						</p>
					);
				} else {
					return (
						<p className='p-[1.5px] bg-red-500 rounded-sm text-white'>Sent</p>
					);
				}
			},
		},
		{
			field: "dlr_request",
			headerName: "Error Code",
			width: 200,
			headerAlign: "left",
			align: "left",
			valueGetter: (params) =>
				getErrorCodeDescription(params?.row?.dlr_request),
		},
	];
	const filterTelco = (value) => {
		if (value.length > 1) {
			console.log(value);
			// console.log(initialRenderedData);
			if (value === "mtn") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.network === "MTN"
				);
				setinitialData(filtered);
			} else if (value === "airtel") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.network === "Airtel"
				);
				setinitialData(filtered);
			} else if (value === "glo") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.network === "Globacom"
				);
				setinitialData(filtered);
			} else if (value === "9mobile") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.network === "9mobile"
				);
				setinitialData(filtered);
			}
		} else {
			// setinitialFilteredRenderedData([]);
			setinitialData(initialFilteredRenderedData);
		}
	};

	const filterStatus = (value) => {
		if (value.length > 1) {
			// setinitialFilteredRenderedData(initialRenderedData);
			console.log(value);
			// console.log(initialFilteredRenderedData);
			if (value === "delivered") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_status === "DELIVRD"
				);
				setinitialData(filtered);
			} else if (value === "undelivered") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_status === "UNDELIV"
				);
				setinitialData(filtered);
			} else if (value === "expired") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_status === "EXPIRED"
				);
				setinitialData(filtered);
			} else if (value === "rejected") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_status === "REJECTD"
				);
				setinitialData(filtered);
			} else if (value === "pending") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_status === null
				);
				console.log(filtered);
				setinitialData(filtered);
			}
		} else {
			setinitialData(initialFilteredRenderedData);
		}
	};

	const getItems = async () => {
		setLoading(true);
		try {
			const { data } = await axios.get(
				`https://ubasms.approot.ng/php/ubatransactions.php?rowsPerPage=${rowsPerPage}`
			);

			console.log(data);

			setinitialData(
				data.sort((a, b) => {
					const dateA = new Date(a.created_at);
					const dateB = new Date(b.created_at);
					return dateB - dateA;
				})
			);
			setinitialFilteredRenderedData(
				data.sort((a, b) => {
					const dateA = new Date(a.created_at);
					const dateB = new Date(b.created_at);
					return dateB - dateA;
				})
			);
			setLoading(false);
			setPage(page + 1);
		} catch (error) {
			setLoading(false);
		}
	};

	const override = {
		display: "block",
		margin: "0 auto",
	};
	const paragraphs = ["Transactional"];

	const handleParagraphClick = (index) => {
		setActiveIndex(index);

		// setRenderedData(paragraphs[activeIndex]);
	};

	useEffect(() => {
		getItems();
		// getOtpItems();

		return () => {
			console.log("cleared data");
		};
	}, []);

	return (
		<div>
			{loading ? (
				<div className='flex justify-center items-center h-screen'>
					<FadeLoader
						loading={loading}
						cssOverride={override}
						size={250}
						aria-label='Loading Spinner'
						data-testid='loader'
					/>
				</div>
			) : (
				<div>
					<div className='border-b-[0.5px] px-2 my-4 border-gray-400 border-solid'>
						<p>Messages</p>
					</div>
					<div className='border-b-[0.5px] justify-between items-center flex px-2 border-gray-400 border-solid h-8'>
						<p className='border-b-[0.5px] pb-6 font-bold text-red-500 border-red-500 border-solid'>
							Logs
						</p>
					</div>
					<div className='my-4'>
						<div className='lg:flex hidden  border-b border-solid border-gray-300 justify-normal h-8'>
							{paragraphs.map((paragraph, index) => (
								<p
									key={index}
									className={`cursor-pointer pb-[30.2px] mx-2 ${
										index === activeIndex
											? "border-green-500 border-b-4 border-solid rounded-sm"
											: ""
									}`}
									onClick={() => {
										handleParagraphClick(index);
										setRenderedData(paragraphs[index]);
									}}
								>
									{paragraph}
								</p>
							))}
						</div>
					</div>
					{downloadButton && (
						<div className='flex justify-end'>
							<CSVLink
								data={transformDataForCSV(initialData)}
								// filename={"custom-report.csv"}
								filename={`SMS_${new Date().toLocaleDateString()}.csv`}
								className='flex items-center px-3 py-2 bg-[#f24b32] text-[#fff] rounded-md hover:bg-[#9ED686] transition duration-300'
							>
								<FaDownload className='mr-2' /> Export
							</CSVLink>
						</div>
					)}
					<div className='lg:flex block justify-center flex-col items-center overflow-auto'>
						<div className='lg:flex lg:justify-between block items-center my-2 w-full p-4'>
							{/* Form 1 */}
							<form
								className='flex lg:my-0 my-4 items-center justify-center text-center  space-x-2'
								onSubmit={filterTable}
							>
								<input
									type='search'
									placeholder='Search Phone Number'
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-1 rounded-sm'
									value={filterValue}
									required
									onChange={(e) => setFilterValue(e.target.value)}
								/>
								<button className='border-[0.8px] border-solid  focus:outline-none border-gray-500 p-1 rounded-sm text-sm text-black  hover:bg-gray-400 hover:text-white'>
									Filter
								</button>
							</form>

							<form
								action=''
								className='flex lg:my-0 my-4 items-center justify-center text-center  space-x-2'
								onSubmit={handleTimestamp}
							>
								<input
									aria-label='Date and time'
									type='datetime-local'
									placeholder='From'
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-1 rounded-sm mx-1'
									value={timeStamp.from}
									onChange={(e) =>
										setTimeStamp({ ...timeStamp, from: e.target.value })
									}
								/>
								<input
									aria-label='Date and time'
									type='datetime-local'
									placeholder='To'
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-1 rounded-sm mx-1'
									value={timeStamp.to}
									onChange={(e) =>
										setTimeStamp({ ...timeStamp, to: e.target.value })
									}
								/>
								<button className='border-[0.8px] border-solid  focus:outline-none border-gray-500 p-1 rounded-sm text-sm text-black  hover:bg-gray-400 hover:text-white'>
									Filter
								</button>
							</form>

							{/* Form 2 */}
							<form className='flex justify-center items-center space-x-2'>
								<select
									name=''
									id=''
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-1 rounded-sm'
									value={status}
									onChange={(e) => {
										setStatus(e.target.value);
										filterStatus(e.target.value);
									}}
								>
									<option value='select'>Select Status</option>
									<option value='delivered'>DELIVRD</option>
									<option value='undelivered'>UNDELIVERED</option>
									<option value='expired'>EXPIRD</option>
									<option value='pending'>PENDING</option>
									<option value='rejected'>REJECTED</option>
								</select>
							</form>
							<form className='flex justify-center lg:my-0 my-4 items-center space-x-2'>
								<select
									name=''
									id=''
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-1 rounded-sm'
									value={telco}
									onChange={(e) => {
										setTelco(e.target.value);
										filterTelco(e.target.value);
									}}
								>
									<option value=''>Select Network</option>
									<option value='mtn'>MTN</option>
									<option value='airtel'>AIRTEL</option>
									<option value='glo'>GLO</option>
									<option value='9mobile'>9MOBILE</option>
								</select>
							</form>
						</div>
						{renderedData === "Transactional" && (
							<div className=' w-full  p-2'>
								<DataGrid
									rows={initialData}
									rowHeight={80}
									columns={dbColumns}
									initialState={{
										pagination: {
											paginationModel: { page: 0, pageSize: 10 },
										},
									}}
									sx={{
										boxShadow: 2,
										border: 0.5,

										padding: 0.5,
									}}
									pageSizeOptions={[10, 20]}
									checkboxSelection
									getRowId={(row) => row?.id}
								/>
							</div>
						)}
						{renderedData === "OTP" &&
							(initialRenderedData.length < 1 ? (
								<>
									<div className='flex justify-center items-center flex-col h-screen'>
										<FadeLoader
											loading={initialRenderedData.length < 1 ? true : false}
											cssOverride={override}
											size={300}
											aria-label='Loading Spinner'
											data-testid='loader'
										/>
									</div>
								</>
							) : (
								<div className=' w-full  p-2'>
									<DataGrid
										rows={initialRenderedData}
										rowHeight={80}
										columns={dbColumns}
										initialState={{
											pagination: {
												paginationModel: { page: 0, pageSize: 10 },
											},
										}}
										sx={{
											boxShadow: 2,
											border: 0.5,

											padding: 0.5,
										}}
										pageSizeOptions={[10, 20]}
										checkboxSelection
										getRowId={(row) => row?.id}
									/>
								</div>
							))}
					</div>
				</div>
			)}
		</div>
	);
};
