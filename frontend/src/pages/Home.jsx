import WelcomeWindow from "../components/WelcomeWindow";

function Home() {
	return (
		<div>
			{/* <WelcomeWindow /> */}
			<div className="flex flex-col items-center justify-center min-h-screen bg-gray-700">
				<h1 className="text-4xl font-bold mb-4 text-gray-400">
					Welcome to the Home Page
				</h1>
				<p className="text-lg text-gray-400">
					This is the home page of your application.
				</p>
			</div>
		</div>
	);
}

export default Home;
