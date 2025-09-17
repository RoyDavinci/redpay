/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios";
import React, { useEffect, useState, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import FadeLoader from "react-spinners/FadeLoader";
import { getNetwork } from "../utils/number";
import { FaDownload } from "react-icons/fa";
import { CSVLink } from "react-csv";
import { debounce } from "lodash";

export const Transactions = () => {
  const [page, setPage] = useState(1);
  const [initialData, setinitialData] = useState([]);
  const [initialRenderedData, setinitialRenderedData] = useState([]);
  const [initialFilteredRenderedData, setinitialFilteredRenderedData] = useState([]);
  const [downloadButton, setDownloadButton] = useState(true);
  const [timeStamp, setTimeStamp] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [filterValue, setFilterValue] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isPartial, setIsPartial] = useState(false);
  const [recentSearches, setRecentSearches] = useState(JSON.parse(localStorage.getItem('recentSearches') || '[]'));
  const [activeIndex, setActiveIndex] = useState(0);
  const [renderedData, setRenderedData] = useState("Transactional");
  const [status, setStatus] = useState("");
  const [telco, setTelco] = useState("");
  const [totalRows, setTotalRows] = useState(0); // New state for total rows

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

  const debouncedSetFilterValue = debounce((value) => {
    setFilterValue(value);
    if (value && !/^(?:\+234|0|234)?[789]\d{0,9}$/.test(value)) {
      setPhoneError("Invalid Nigerian phone number");
    } else {
      setPhoneError("");
    }
  }, 300);

  const saveSearch = (value) => {
    if (value && !recentSearches.includes(value) && /^(?:\+234|0)[789]\d{9}$/.test(value)) {
      const newSearches = [value, ...recentSearches.slice(0, 4)];
      setRecentSearches(newSearches);
      localStorage.setItem('recentSearches', JSON.stringify(newSearches));
    }
  };

  const filterTable = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let formattedValue;
        if (filterValue.length === 11 && /^0[789]\d{9}$/.test(filterValue)) {
        // 080… format → convert to +234…
        formattedValue = "+234" + filterValue.slice(1);
      } else if (filterValue.startsWith("234")) {
        // 234… format → add +
        formattedValue = "+" + filterValue;
      } else if (filterValue.startsWith("+234")) {
        // already correct
        formattedValue = filterValue;
      } else {
        // fallback (just send as is)
        formattedValue = filterValue;
      }

       console.log("Formatted phone number being sent:", formattedValue);
         console.log("Partial match flag:", isPartial);

      const { data: portingData } = await axios.get(
		`https://ubasms.approot.ng/php/searchPorting.php?phone=${encodeURIComponent(formattedValue)}`
       
      );

       console.log("Porting API response:", portingData);

      const validNetworks = ["MTN", "Airtel", "Glo", "9mobile"];
      const isValidNetwork = validNetworks.includes(portingData.network);
 // Main backend call
    const url = `https://messaging.approot.ng/newportal/number.php?phone=${encodeURIComponent(formattedValue)}&partial=${isPartial}`;
    console.log("Fetching data from:", url);

    const { data } = await axios.get(url);

    console.log("Response from localhost API:", data);


      const updatedData = data.data.map((item) => ({
        ...item,
        network: isValidNetwork ? portingData.network : item.network,
      }));

      const sortedData = updatedData.sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
      });

      setinitialData(sortedData);
      setinitialFilteredRenderedData(sortedData);
      setDownloadButton(true);
      setTelco(isValidNetwork ? portingData.network : "");
      saveSearch(formattedValue);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setinitialData([]);
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

  const transformDataForCSV = useMemo(() => {
    return initialData.map((row) => ({
      msisdn: "'" + row.msisdn,
      network: row.network || getNetwork(row.msisdn),
      senderid: row.senderid,
      created_at: row.created_at,
      status: getDlrStatusDescription(row.dlr_request),
      error_code: getErrorCodeDescription(row.dlr_status),
      message: row.text || row.message || row.content || "", // Include message field
      externalMessageId: window.crypto.randomUUID(),
      requestType: "SMS",
    }));
  }, [initialData]);

  const handleTimestamp = (e) => {
     e.preventDefault();
    // const fromDate = new Date(timeStamp.from);
    // const toDate = new Date(timeStamp.to);
    // const filtered = initialFilteredRenderedData.filter((item) => {
    //   const itemDate = new Date(item.created_at);
    //   return itemDate >= fromDate && itemDate <= toDate;
    // });
    // const sortedFiltered = filtered.sort((a, b) => {
    //   const dateA = new Date(a.created_at);
    //   const dateB = new Date(b.created_at);
    //   return dateB - dateA;
    // });
    // setinitialData(sortedFiltered);
	getItems();
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
      type: "string",
      width: 300,
      headerAlign: "left",
      align: "left",
      renderCell: (params) => {
        const message = params.value || params.row.text || params.row.message || "No message";
        return (
          <div 
            className="text-sm p-2 overflow-hidden" 
            title={message}
            style={{ 
              whiteSpace: 'pre-wrap', 
              wordBreak: 'break-word',
              maxHeight: '60px',
              overflow: 'auto'
            }}
          >
            {message}
          </div>
        );
      },
      valueGetter: (params) => {
		     // Add null checks
    		if (!params || !params.row) return "";
        return params.row.text || params.row.message || params.row.content || "";
      },
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
  type: "string",
  width: 120,

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
    // Check for both null and empty string for pending status
    if (params.row.dlr_request === "" || params.row.dlr_request === null || params.row.dlr_request === undefined) {
      return (
       <p className='p-[1.5px] rounded-sm bg-yellow-400 text-black'>Pending</p>
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
      // This should now rarely be reached, but keeping as fallback
      return (
        <p className='p-[1.5px] bg-gray-400 rounded-sm text-white'>Unknown</p>
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


		    // Format dates properly - convert datetime-local to date only
			const fromDate = timeStamp.from ? timeStamp.from.split('T')[0] : '';
			const toDate = timeStamp.to ? timeStamp.to.split('T')[0] : '';

			const query = `https://messaging.approot.ng/newportal/messages.php?page=${page}&pageSize=50&from=${encodeURIComponent(fromDate)}&to=${encodeURIComponent(toDate)}&status=${encodeURIComponent(status)}&telco=${encodeURIComponent(telco)}`;
				console.log("Fetching data with query:", query);
				const { data } = await axios.get(query);
				console.log("API response:", data);

      if (!data || !Array.isArray(data.data)) {
        console.error("Invalid API response structure:", data);
        setinitialData([]);
        setinitialFilteredRenderedData([]);
        setinitialRenderedData([]);
        setTotalRows(0);
        setLoading(false);
        return;
      }

      const sorted = data.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setinitialData(sorted);
      setinitialFilteredRenderedData(sorted);
      setinitialRenderedData([]);
      setTotalRows(data.total || 0);
      if (data.data.length === 0) {
        console.log("No transactional data found. Total records:", data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data in getItems:", error);
      setinitialData([]);
      setinitialFilteredRenderedData([]);
      setinitialRenderedData([]);
      setTotalRows(0);
      setLoading(false);
    }
  };

  const getOtpItems = async () => {
    setLoading(true);
    try {
    //   const query =  '' `http://localhost:8000/otp_messages.php?page=${page}&pageSize=50`;
	const query = ``;
      console.log("Fetching OTP data with query:", query);
      const { data } = await axios.get(query);
      console.log("OTP API response:", data);

      if (!data || !Array.isArray(data.data)) {
        console.error("Invalid OTP API response structure:", data);
        setinitialRenderedData([]);
        setTotalRows(0);
        setLoading(false);
        return;
      }

      const sorted = data.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setinitialRenderedData(sorted);
      setTotalRows(data.total || 0);
      if (data.data.length === 0) {
        console.log("No OTP data found. Total records:", data.total);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching OTP data in getOtpItems:", error);
      setinitialRenderedData([]);
      setTotalRows(0);
      setLoading(false);
    }
  };

  const override = {
    display: "block",
    margin: "0 auto",
  };

  const paragraphs = ["Transactional", "OTP"];

  const handleParagraphClick = (index) => {
    setActiveIndex(index);
    setRenderedData(paragraphs[index]);
  };

  useEffect(() => {
    if (renderedData === "Transactional") {
      getItems();
    } else if (renderedData === "OTP") {
      getOtpItems();
    }
    return () => {
      console.log("cleared data");
    };
  }, [renderedData, page, status, telco, timeStamp]);

  const filename = `SMS_${filterValue || 'all'}_${status || 'all'}_${telco || 'all'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`;

  const handleExport = () => {
    if (initialData.length === 0) {
      alert('No data to export');
      return false;
    }
    if (initialData.length > 10000) {
      alert('Large export may slow your browser.');
    }
    return window.confirm(`Export ${initialData.length} rows to CSV?`);
  };

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
          {/* Filter Badges */}
          <div className='flex space-x-2 mb-4'>
            {filterValue && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md">Phone: {filterValue}</span>}
            {timeStamp.from && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md">From: {timeStamp.from}</span>}
            {timeStamp.to && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md">To: {timeStamp.to}</span>}
            {status && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md">Status: {status}</span>}
            {telco && <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md">Network: {telco}</span>}
          </div>

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

          <div className='flex justify-end mb-6'>
            <CSVLink
              data={transformDataForCSV}
              filename={filename}
              className={`flex items-center px-4 py-2 bg-[#f24b32] text-white rounded-md transition duration-300 ${initialData.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#9ED686]'}`}
              onClick={handleExport}
            >
              <FaDownload className='mr-2' /> Export
            </CSVLink>
            <button
              onClick={() => {
                setFilterValue('');
                setTimeStamp({ from: '', to: '' });
                setStatus('');
                setTelco('');
                setinitialData(initialFilteredRenderedData);
                setPhoneError('');
                setIsPartial(false);
              }}
              className='ml-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500'
            >
              Clear Filters
            </button>
          </div>

          <div className='lg:flex block justify-center flex-col items-center overflow-auto'>
            <div className='lg:flex lg:justify-between block items-center my-6 w-full p-4 bg-gray-50 rounded-lg shadow-lg relative'>
              <form
                className='flex lg:my-0 my-4 items-center justify-center space-x-4'
                onSubmit={filterTable}
              >
                <div className='relative'>
                  <input
                    type='search'
                    placeholder='Search Phone Number (e.g., +2348012345678)'
                    className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-2 rounded-md shadow-sm w-full max-w-xs'
                    value={filterValue}
                    onChange={(e) => debouncedSetFilterValue(e.target.value)}
                  />
                  {recentSearches.length > 0 && filterValue.length >= 4 && (
                    <ul className='bg-white border border-gray-300 rounded-md shadow-sm mt-1 max-h-40 overflow-y-auto absolute w-full max-w-xs z-10'>
                      {recentSearches.filter(s => s.includes(filterValue)).map((s, i) => (
                        <li
                          key={i}
                          className='px-3 py-2 hover:bg-gray-100 cursor-pointer'
                          onClick={() => {
                            setFilterValue(s);
                            filterTable({ preventDefault: () => {} });
                          }}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                  {phoneError && <p className='text-red-500 text-sm mt-1'>{phoneError}</p>}
                </div>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={isPartial}
                    onChange={() => setIsPartial(!isPartial)}
                    className='mr-2'
                  />
                  <label>Partial match</label>
                </div>
                <button
                  type='submit'
                  disabled={phoneError}
                  className='px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition duration-300 disabled:opacity-50'
                >
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
                  name='status'
                  id='status'
                  className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-2 rounded-md shadow-sm'
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    filterStatus(e.target.value);
                  }}
                >
                  <option value='select'>Select Status</option>
                  <option value=''>Select Status</option>
					<option value='DELIVRD'>DELIVERED</option>
					<option value='UNDELIV'>UNDELIVERED</option>
					<option value='EXPIRED'>EXPIRED</option>
					<option value=''>PENDING</option> 
					<option value='REJECTD'>REJECTED</option>
                </select>
              </form>
              <form className='flex justify-center items-center lg:my-0 my-4 space-x-4'>
                <select
                  name='telco'
                  id='telco'
                  className='border-[0.8px] border-solid text-sm focus:outline-none border-gray-500 p-2 rounded-md shadow-sm'
                  value={telco}
                  onChange={(e) => {
                    setTelco(e.target.value);
                    filterTelco(e.target.value);
                  }}
                >
                  <option value=''>Select Network</option>
                 <option value='MTN'>MTN</option>
				<option value='AIRTEL'>AIRTEL</option>
				<option value='GLO'>GLO</option>
				<option value='9MOBILE'>9MOBILE</option>
                </select>
              </form>
            </div>
            <div className='w-full p-2'>
              {renderedData === "Transactional" && (
                initialData.length > 0 ? (
                  <DataGrid
                    rows={initialData}
                    rowHeight={80}
                    columns={dbColumns}
                    initialState={{
                      pagination: {
                        paginationModel: { page: page - 1, pageSize: 50 },
                      },
                    }}
                    sx={{
                      boxShadow: 2,
                      border: 0.5,
                      padding: 0.5,
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    paginationMode="server"
                    rowCount={totalRows}
                    onPaginationModelChange={(model) => setPage(model.page + 1)}
                    checkboxSelection
                    getRowId={(row) => row?.id}
                  />
                ) : (
                  <p className='text-gray-600 text-center mt-4'>No transactions found</p>
                )
              )}
              {renderedData === "OTP" && (
                initialRenderedData.length > 0 ? (
                  <DataGrid
                    rows={initialRenderedData}
                    rowHeight={80}
                    columns={dbColumns}
                    initialState={{
                      pagination: {
                        paginationModel: { page: page - 1, pageSize: 50 },
                      },
                    }}
                    sx={{
                      boxShadow: 2,
                      border: 0.5,
                      padding: 0.5,
                    }}
                    pageSizeOptions={[10, 20, 50]}
                    paginationMode="server"
                    rowCount={totalRows}
                    onPaginationModelChange={(model) => setPage(model.page + 1)}
                    checkboxSelection
                    getRowId={(row) => row?.id}
                  />
                ) : (
                  <p className='text-gray-600 text-center mt-4'>No OTP messages found</p>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;