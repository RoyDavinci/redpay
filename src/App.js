import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Image from "./assets/images.png";
import axios from "axios";
import { Login } from "./components/Login";
import { Sidebar } from "./components/Sidebar";
import { Design } from "./components/Design";
import { Transactions } from "./components/Transactions";
// import { Logs } from "./components/Logs";

function App() {
	const [items, setItems] = useState([]);
	const [isLoadingOtp, setIsLoadingOtp] = useState(true);

	const [showSideBar, setShowSidebar] = useState(false);
	const [otpItems, setOtpItems] = useState([]);
	// const [dlrData, setDlrData] = useState([]);
	const [isTableVisible, setTableVisible] = useState(false);
	const [isMessageVisible, setMessageVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [loginState, setLoginState] = useState(true);
	const [element, setElement] = useState("Dashboard");
	// const [count, setCount] = useState({ total: 0, failure: "", success: "" });
	const [internationalData, setInternationalData] = useState({});
	const [internationalOtpData, setInternationalOtpData] = useState({});

	const sidebarfunc = () => {
		setShowSidebar(!showSideBar);
	};

	const logout = () => {
		localStorage.clear();
		setLoginState(true);
	};
	const closeSidemenu = useCallback(() => {
		if (isTableVisible) {
			setTableVisible(false);
			console.log("first");
			console.log(isTableVisible);
		} else if (isMessageVisible) {
			setMessageVisible(false);
			console.log("first waiting");
		}
		return;
	}, [isMessageVisible, isTableVisible]);

	useEffect(() => {
		document.body.addEventListener("click", closeSidemenu);

		return function cleanup() {
			document.body.removeEventListener("click", closeSidemenu);
		};
	}, [closeSidemenu]);

	const getItems = async () => {
		const checkLocalstorage = localStorage.getItem("token");
		console.log(checkLocalstorage);
		if (!checkLocalstorage) {
			setLoginState(true);
			return;
		}
		setIsLoading(true);
		try {
			const { data } = await axios.get(
				"https://messaging.approot.ng/newportal/portal.php"
			);
			setItems(data);
			setIsLoading(false);
		} catch (error) {
			setIsLoading(false);
			console.error(error);
		}
	};

	useEffect(() => {
		getItems();

		const interval = setInterval(() => {
			getItems();
		}, 200000);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<>
			<>
				{loginState ? (
					<Login setLoginState={setLoginState} />
				) : (
					<div className='flex h-screen   '>
						<Sidebar
							setElement={setElement}
							element={element}
							logo={Image}
							logout={logout}
						/>

						<main className='flex-1 flex relative z-0 flex-col overflow-auto p-4'>
							{/* Header */}

							{/* Content */}
							{element === "Dashboard" && (
								<Design items={items} loading={isLoading} />
							)}
							{element === "Design" && <Design />}
							{/* {element === "Logs" && <Logs />} */}
							{element === "Transactions" && (
								<>
									{" "}
									<Transactions />
								</>
							)}
						</main>
					</div>
				)}
			</>
		</>
	);
}

export default App;
