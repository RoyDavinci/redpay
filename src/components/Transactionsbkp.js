/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import FadeLoader from "react-spinners/FadeLoader";
import { getNetwork } from "../utils/number";
import { FaDownload } from "react-icons/fa";
import { CSVLink } from "react-csv";

export const Transactions = () => {
	const [page, setPage] = useState(1);
	const [initialData, setinitialData] = useState([]);
	const [initialRenderedData, setinitialRenderedData] = useState([]);
	const [initialFilteredRenderedData, setinitialFilteredRenderedData] =
		useState([]);
	const [downloadButton, setDownloadButton] = useState(false);

	const [timeStamp, setTimeStamp] = useState({ from: "", to: "" });

	const [loading, setLoading] = useState(false);
	const [filterValue, setFilterValue] = useState("");
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
		if (report === "0") {
			return "Awaiting DLR";
		}
		try {
			if (
				typeof report === "string" &&
				errorCodeDescriptions[report] !== undefined
			) {
				return `${report}: ${errorCodeDescriptions[report]}`;
			} else if (isObject(report)) {
				const parsedReport = JSON.parse(report);
				const message = parsedReport.message || "";

				const errorCodeMatch = message.match(/err:([0-9a-zA-Z]+)/);
				if (errorCodeMatch) {
					const errorCode = errorCodeMatch[1];
					const description = errorCodeDescriptions[errorCode];
					return description ? `${errorCode}: ${description}` : errorCode;
				}
			}

			return "Awaiting DLR";
		} catch (e) {
			console.error("Error in getErrorCodeDescription:", e);
			return "Awaiting DLR";
		}
	};

	const filterTable = async () => {
		setLoading(true);
		try {
			let formattedValue;

			if (filterValue.length === 11) {
				formattedValue = "234" + filterValue.slice(1);
			} else if (filterValue.length === 13) {
				formattedValue = filterValue;
			} else {
				formattedValue = filterValue;
			}

			const { data: portingData } = await axios.get(
				`https://ubasms.approot.ng/php/searchPorting.php?phone=${formattedValue}`
			);

			console.log("Porting Data:", portingData);

			const validNetworks = ["MTN", "Airtel", "Glo", "9mobile"];
			const isValidNetwork = validNetworks.includes(portingData);

			const username = localStorage.getItem("username");
			const { data } = await axios.get(
				`https://messaging.approot.ng/newportal/number.php?phone=${formattedValue}&username=${username}`
			);

			const updatedData = data.map((item) => ({
				...item,
				network: isValidNetwork ? portingData : item.network,
			}));

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
				return "Delivered";
		}
	};

	const transformDataForCSV = (data) => {
		return data.map((row) => ({
			msisdn: "'" + row.msisdn,
			network: getNetwork(row.msisdn),
			senderid: row.senderid,
			created_at: row.created_at,
			status: getDlrStatusDescription(row.dlr_status),
			error_code: getErrorCodeDescription(row.dlr_request),
			externalMessageId: window.crypto.randomUUID(),
			requestType: "SMS",
		}));
	};

	const handleTimestamp = (e) => {
		e.preventDefault();

		const fromDate = new Date(timeStamp.from);
		const toDate = new Date(timeStamp.to);

		const filtered = initialFilteredRenderedData.filter((item) => {
			const itemDate = new Date(item.created_at);
			return itemDate >= fromDate && itemDate <= toDate;
		});

		const sortedFiltered = filtered.sort((a, b) => {
			const dateA = new Date(a.created_at);
			const dateB = new Date(b.created_at);
			return dateB - dateA;
		});

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
				const network = params?.toLowerCase();
				const knownNetworks = ["glo", "9mobile", "airtel"];

				if (
					!network ||
					(!knownNetworks.includes(network) && params?.row?.msisdn)
				) {
					return getNetwork(params?.row?.msisdn);
				} else {
					return params;
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
			valueGetter: (params) => {
				return params || "";
			},
		},
		{
			field: "created_at",
			headerName: "Date Time- Delivery Time",
			width: 200,
			headerAlign: "left",
			align: "left",
		},
		{
			field: "dlr_request",
			headerName: "Status",
			width: 200,
			headerAlign: "left",
			align: "left",
			renderCell: (params) => {
				if (params.row.dlr_request === "") {
					return (
						<p className='p-[0.5px] bg-yellow-300 text-yellow-400'>Pending</p>
					);
				} else if (params.row?.dlr_request === "DELIVRD") {
					return (
						<p className='p-[1.5px] rounded-sm bg-green-500 text-white'>
							Delivered
						</p>
					);
				} else if (
					params.row.dlr_request === "EXPIRED" ||
					params.row?.dlr_request?.includes("EXP")
				) {
					return (
						<p className='p-[1.5px] bg-gray-300 rounded-sm text-black'>
							Expired
						</p>
					);
				} else if (
					params.row.dlr_request === "UNDELIV" ||
					params.row?.dlr_request?.includes("UND")
				) {
					return (
						<p className='p-[1.5px] bg-gray-300 rounded-sm text-red-500'>
							Undelivered
						</p>
					);
				} else if (
					params.row.dlr_request === "REJECTD" ||
					params.row?.dlr_request?.includes("REJ")
				) {
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
			field: "dlr_status",
			headerName: "Error Code",
			width: 200,
			headerAlign: "left",
			align: "left",
			valueGetter: (params) => getErrorCodeDescription(params),
		},
	];
	const filterTelco = (value) => {
		if (value.length > 1) {
			if (value === "mtn") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.network.toLowerCase() === "mtn"
				);
				setinitialData(filtered);
			} else if (value === "airtel") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.network.toLowerCase() === "airtel"
				);
				setinitialData(filtered);
			} else if (value === "glo") {
				const filtered = initialFilteredRenderedData.filter(
					(item) =>
						item.network.toLowerCase() === "Globacom" ||
						item.network.toLowerCase() === "Glo"
				);
				setinitialData(filtered);
			} else if (value === "9mobile") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.network.toLowerCase() === "9mobile"
				);
				setinitialData(filtered);
			}
		} else {
			setinitialData(initialFilteredRenderedData);
		}
	};

	const filterStatus = (value) => {
		if (value.length > 1) {
			if (value === "delivered") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_request === "DELIVRD"
				);
				setinitialData(filtered);
			} else if (value === "undelivered") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_request === "UNDELIV"
				);
				setinitialData(filtered);
			} else if (value === "expired") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_request === "EXPIRED"
				);
				setinitialData(filtered);
			} else if (value === "rejected") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_request === "REJECTD"
				);
				setinitialData(filtered);
			} else if (value === "pending") {
				const filtered = initialFilteredRenderedData.filter(
					(item) => item.dlr_request === null
				);
				setinitialData(filtered);
			}
		} else {
			setinitialData(initialFilteredRenderedData);
		}
	};
	const getItems = async () => {
		setLoading(true);
		try {
			const username = localStorage.getItem("username");
			const { data } = await axios.get(
				`https://messaging.approot.ng/newportal/messages.php?username=${username}`
			);

			const sorted = data.sort(
				(a, b) => new Date(b.created_at) - new Date(a.created_at)
			);

			setinitialData(sorted);
			setinitialFilteredRenderedData(sorted);
			setPage(page + 1);
			setLoading(false);
		} catch (error) {
			setLoading(false);
			console.error(error);
		}
	};

	const override = {
		display: "block",
		margin: "0 auto",
	};
	const paragraphs = ["Transactional"];

	const handleParagraphClick = (index) => {
		setActiveIndex(index);
	};

	useEffect(() => {
		getItems();

		return () => {
			console.log("cleared data");
		};
	}, []);

	return (
		<div className='p-6'>
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
					<div className='border-b-[0.5px] px-4 my-6 border-gray-400 border-solid'>
						<p className='text-xl font-semibold text-gray-800'>Messages</p>
					</div>
					<div className='border-b-[0.5px] flex justify-between items-center px-4 py-2 border-gray-400 border-solid'>
						<p className='font-bold text-red-500 border-b-2 border-red-500'>
							Logs
						</p>
					</div>

					<div className='my-6'>
						<div className='lg:flex hidden border-b border-solid border-gray-300 justify-normal h-8'>
							{paragraphs.map((paragraph, index) => (
								<p
									key={index}
									className={`cursor-pointer pb-2 mx-3 text-lg font-medium transition-colors duration-300 ${
										index === activeIndex
											? "border-b-4 border-green-500 text-green-500"
											: "hover:text-green-500"
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
						<div className='flex justify-end mb-6'>
							<CSVLink
								data={transformDataForCSV(initialData)}
								filename={`SMS_${new Date().toLocaleDateString()}.csv`}
								className='flex items-center px-4 py-2 bg-[#f24b32] text-white rounded-md hover:bg-[#9ED686] transition duration-300'
							>
								<FaDownload className='mr-2' /> Export
							</CSVLink>
						</div>
					)}

					<div className='lg:flex block justify-center flex-col items-center overflow-auto'>
						<div className='lg:flex lg:justify-between block items-center my-6 w-full p-4 bg-gray-50 rounded-lg shadow-lg'>
							<form
								className='flex lg:my-0 my-4 items-center justify-center space-x-4'
								onSubmit={filterTable}
							>
								<input
									type='search'
									placeholder='Search Phone Number'
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-2 rounded-md shadow-sm w-full max-w-xs'
									value={filterValue}
									required
									onChange={(e) => setFilterValue(e.target.value)}
								/>
								<button className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-300'>
									Filter
								</button>
							</form>
							<form
								action=''
								className='flex lg:my-0 my-4 items-center justify-center space-x-4'
								onSubmit={handleTimestamp}
							>
								<input
									aria-label='Date and time'
									type='datetime-local'
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-2 rounded-md shadow-sm'
									value={timeStamp.from}
									onChange={(e) =>
										setTimeStamp({ ...timeStamp, from: e.target.value })
									}
								/>
								<input
									aria-label='Date and time'
									type='datetime-local'
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-2 rounded-md shadow-sm'
									value={timeStamp.to}
									onChange={(e) =>
										setTimeStamp({ ...timeStamp, to: e.target.value })
									}
								/>
								<button className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-300'>
									Filter
								</button>
							</form>
							<form className='flex justify-center items-center space-x-4'>
								<select
									name=''
									id=''
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-2 rounded-md shadow-sm'
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
							<form className='flex justify-center items-center lg:my-0 my-4 space-x-4'>
								<select
									name=''
									id=''
									className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-2 rounded-md shadow-sm'
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
						<div className='w-full p-2'>
							{renderedData === "Transactional" && (
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
							)}
							{renderedData === "OTP" &&
								(initialRenderedData.length < 1 ? (
									<div className='flex justify-center items-center flex-col h-screen'>
										<FadeLoader
											loading={initialRenderedData.length < 1 ? true : false}
											cssOverride={override}
											size={300}
											aria-label='Loading Spinner'
											data-testid='loader'
										/>
									</div>
								) : (
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
								))}
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
