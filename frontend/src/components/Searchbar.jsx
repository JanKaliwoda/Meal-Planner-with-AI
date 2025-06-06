{
	/* <script src="frontend\node_modules\flowbite\dist\flowbite.min.js"></script> */
}

function Searchbar() {
	return (
		// Searchbar
		<div className="bg-gray-900">
			<form class="max-w-md mx-auto py-10">
				<label
					for="default-search"
					class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
				>
					Search
				</label>
				<div class="relative">
					<div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
						<svg
							class="w-4 h-4 text-gray-500 dark:text-gray-400"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 20 20"
						>
							<path
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
							/>
						</svg>
					</div>
					<input
						type="search"
						id="default-search"
						class="block w-full p-4 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
						placeholder="Search Ingredients..."
						required
					/>
					<button
						type="submit"
						class="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					>
						Search
					</button>
				</div>
			</form>

			{/* // Ingredient Tiles */}

			<div class="p-5 bg-gray-100 dark:bg-gray-900">
				<div class="flex flex-wrap justify-center gap-4">
					<div class="px-6 py-2 border-2 border-gray-500 rounded-3xl text-gray-700 dark:text-gray-300 text-center">
						elo
					</div>
					<div class="px-6 py-2 border-2 border-gray-500 rounded-3xl text-gray-700 dark:text-gray-300 text-center">
						longer elo text
					</div>
					<div class="px-6 py-2 border-2 border-gray-500 rounded-3xl text-gray-700 dark:text-gray-300 text-center">
						elo again
					</div>
				</div>
			</div>
			<script src="frontend\node_modules\flowbite\dist\flowbite.min.js"></script>

			{/* // Recipe Tiles */}
			<div class="p-20 bg-gray-100 dark:bg-gray-800">
				<div class="max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
					<a href="#">
						<h5 class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
							Tosty z cytryną
						</h5>
					</a>
					<p class="mb-3 font-normal text-gray-700 dark:text-gray-400">
						chleb, cytryna, masło, sól, pieprz
					</p>
					<a
						href="#"
						class="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
					>
						Otwórz
						<svg
							class="rtl:rotate-180 w-3.5 h-3.5 ms-2"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 14 10"
						>
							<path
								stroke="currentColor"
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M1 5h12m0 0L9 1m4 4L9 9"
							/>
						</svg>
					</a>
				</div>
			</div>
		</div>
	)
}

export default Searchbar
