{
	/* <script src="frontend\node_modules\flowbite\dist\flowbite.min.js"></script> */
}
import React from "react";
import "../assets/layered-waves-haikei.svg"; // Ensure this path is correct

function Searchbar() {
	return (
		// Searchbar
		<div className="bg-[url('../assets/layered-waves-haikei.svg')] bg-fixed bg-cover bg-center bg-no-repeat">
			<div className="bg-gunmetal-500">
			<form class="max-w-md mx-auto py-10 ">
				<label
					for="default-search"
					class="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white"
				>
					Search
				</label>
				<div class="relative">
        <input
          type="search"
          id="default-search"
          class="block w-full p-4 ps-5 placeholder-office-green-600 text-sm text-spring-green-500 border-2 border-office-green-500 rounded-full bg-gray-50/0 focus:ring-emerald-500 focus:border-spring-green-500 [&::-webkit-search-cancel-button]:appearance-none"
          placeholder="Search Ingredients..."
          required
        />
        <button
          type="submit"
          class="absolute end-3 top-1/2 -translate-y-1/2 p-2 hover:bg-emerald-500 rounded-full"
        >
          <svg
            class="w-4 h-4 text-office-green-500"
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
        </button>
      </div>
			</form>
			</div>

			{/* // Ingredient Tiles */}

			<div class="p-5 ">
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
			<div class="p-20 ">
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
