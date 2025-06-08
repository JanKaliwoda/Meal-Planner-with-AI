"use client"

import { useState, useEffect } from "react"
import backgroundImage from "../assets/layered-waves-haikei.svg"
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"
import SpotlightCard from "../components/SpotlightCard"
import { ACCESS_TOKEN } from "../constants"
import api from "../api"


export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentView, setCurrentView] = useState("week")
  const [currentMonth, setCurrentMonth] = useState("")
  const [currentDate, setCurrentDate] = useState("")
  const [currentDateObj, setCurrentDateObj] = useState(new Date())
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  type Recipe = {
  id: number;
  name: string;
  description: string;
  steps: string;
  ingredients: Array<{
    id: number;
    name: string;
  }>;
  created_by: number | null; // Changed to number|null since it's a foreign key to User
  created_by_ai: boolean;
}

type CalendarEvent = {
  id: number;
  recipe: Recipe;
  date: string; // Format: 'YYYY-MM-DD'
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  user: number; // Changed to number since it's a foreign key to User
}
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Add these with your other state declarations
const [events, setEvents] = useState<CalendarEvent[]>([])
const [isLoading, setIsLoading] = useState(true)
// Update the fetchMeals function
const fetchMeals = async () => {
  setIsLoading(true)
  try {
    const token = localStorage.getItem(ACCESS_TOKEN)
    if (!token) {
      navigate('/login')
      return
    }

    const response = await api.get('/api/meals/', {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })

    // Convert meals to calendar events
    const calendarEvents: CalendarEvent[] = response.data.map(meal => ({
      id: meal.id,
      recipe: meal.recipe,
      date: meal.date,
      meal_type: meal.meal_type,
      user: meal.user
    }))

    setEvents(calendarEvents)
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem(ACCESS_TOKEN)
      navigate('/login')
    } else {
      console.error('Error fetching meals:', error)
    }
  } finally {
    setIsLoading(false)
  }
}

// Update useEffect to handle initial data fetch
useEffect(() => {
  const initializeCalendar = async () => {
    setIsLoaded(true)
    
    // Get current date
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())

    // Update states with current date
    setCurrentMonth(today.toLocaleString('default', { month: 'long', year: 'numeric' }))
    setCurrentDate(`${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}`)
    setWeekDates(getWeekDates(startOfWeek))

    // Fetch meals
    await fetchMeals()
  }

  initializeCalendar()
}, [])


  // Sample calendar days for the week view
  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
  const [weekDates, setWeekDates] = useState([3, 4, 5, 6, 7, 8, 9])
  const timeSlots = Array.from({ length: 9 }, (_, i) => i + 8) // 8 AM to 4 PM
  
  const isToday = (date: number) => {
  const today = new Date()
  const currentWeekDate = new Date(currentDateObj)
  currentWeekDate.setDate(date)
  
  return (
    today.getDate() === currentWeekDate.getDate() &&
    today.getMonth() === currentWeekDate.getMonth() &&
    today.getFullYear() === currentWeekDate.getFullYear()
  )
}

  // Helper function to calculate event position and height
  const calculateEventStyle = (startTime, endTime) => {
    const start = Number.parseInt(startTime.split(":")[0]) + Number.parseInt(startTime.split(":")[1]) / 60
    const end = Number.parseInt(endTime.split(":")[0]) + Number.parseInt(endTime.split(":")[1]) / 60
    const top = (start - 8) * 80 // 80px per hour
    const height = (end - start) * 80
    return { top: `${top}px`, height: `${height}px` }
  }

  // Sample calendar for mini calendar
  const daysInMonth = 31
  const firstDayOffset = 5 // Friday is the first day of the month in this example
  const miniCalendarDays = Array.from({ length: daysInMonth + firstDayOffset }, (_, i) =>
    i < firstDayOffset ? null : i - firstDayOffset + 1,
  )

  // Sample my calendars
  const myCalendars = [
    { name: "My Calendar", color: "bg-blue-500" },
    { name: "Work", color: "bg-green-500" },
    { name: "Personal", color: "bg-purple-500" },
    { name: "Family", color: "bg-orange-500" },
  ]


  const handlePreviousWeek = () => {
  const newDate = new Date(currentDateObj)
  newDate.setDate(newDate.getDate() - 7)
  
  setCurrentDateObj(newDate)
  setCurrentMonth(newDate.toLocaleString('default', { month: 'long', year: 'numeric' }))
  setCurrentDate(`${newDate.toLocaleString('default', { month: 'long' })} ${newDate.getDate()}`)
  
  const startOfWeek = new Date(newDate)
  startOfWeek.setDate(newDate.getDate() - newDate.getDay())
  setWeekDates(getWeekDates(startOfWeek))
}

const handleNextWeek = () => {
  const newDate = new Date(currentDateObj)
  newDate.setDate(newDate.getDate() + 7)
  
  setCurrentDateObj(newDate)
  setCurrentMonth(newDate.toLocaleString('default', { month: 'long', year: 'numeric' }))
  setCurrentDate(`${newDate.toLocaleString('default', { month: 'long' })} ${newDate.getDate()}`)
  
  const startOfWeek = new Date(newDate)
  startOfWeek.setDate(newDate.getDate() - newDate.getDay())
  setWeekDates(getWeekDates(startOfWeek))
}

// Add this helper function after your imports
const getWeekDates = (startDate: Date) => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    return date.getDate()
  })
}

  // Update your existing useEffect
useEffect(() => {
  setIsLoaded(true)
  
  // Get current date
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())

  // Update states with current date
  setCurrentMonth(today.toLocaleString('default', { month: 'long', year: 'numeric' }))
  setCurrentDate(`${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}`)
  setWeekDates(getWeekDates(startOfWeek))

  // Fetch meals
  fetchMeals()
}, [])

// Update your handleToday function to use the helper
const handleToday = () => {
  const today = new Date()
  setCurrentDateObj(today)
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  
  setCurrentMonth(today.toLocaleString('default', { month: 'long', year: 'numeric' }))
  setCurrentDate(`${today.toLocaleString('default', { month: 'long' })} ${today.getDate()}`)
  setWeekDates(getWeekDates(startOfWeek))
}

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  return (
    <div className="relative min-h-screen bg-gunmetal-500">
      <img
        src={backgroundImage}
        alt="Background waves"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <Navbar onSidebarChange={setIsSidebarOpen} />

          {/* Back Button */}
    <button
        onClick={() => navigate("/")}
        className={`absolute top-4 left-20 text-spring-green-400 hover:text-emerald-500 font-semibold 
        transition-all flex items-center gap-2 ${
          isSidebarOpen ? 'opacity-0 z-30' : 'opacity-100 z-50'
        }`}
      >
      <span className="text-xl">←</span>
      Back to Main Page
    </button>
    
          {/* Main Content */}
          <main className="relative h-screen w-full flex">
      {/* Sidebar */}
      <div
        className={`w-64 h-full bg-gunmetal-400/80 backdrop-blur-lg p-4 shadow-xl border-r border-office-green-500 rounded-tr-3xl opacity-0 ${
          isLoaded ? "animate-fade-in" : ""
        } flex flex-col justify-between`}
        style={{ animationDelay: "0.4s" }}
      >
        <div>
          <button className="mb-6 flex items-center justify-center gap-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors w-full px-4 py-3">
            <span className="text-xl">+</span>
            <span>Create</span>
          </button>
    
                {/* Mini Calendar */}
                <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-spring-green-400 font-medium">{currentMonth}</h3>
              
            </div>
          </div>
    
                {/* My Calendars */}
                <div>
            <h3 className="text-spring-green-400 font-medium mb-3">📅 My calendars</h3>
            <div className="space-y-2">
              {myCalendars.map((cal, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-sm ${cal.color}`}></div>
                  <span className="text-spring-green-400 text-sm">{cal.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    
            {/* Calendar View */}
            <div
        className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.6s" }}
      >
              {/* Calendar Controls */}
<div className="flex items-center justify-between p-4 border-b border-office-green-500">
  <div className="flex items-center gap-4">
    <button 
      onClick={handleToday}
      className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
    >
      Today
    </button>
    <div className="flex">
      <button 
        onClick={handlePreviousWeek}
        className="p-2 text-spring-green-400 hover:bg-gunmetal-300 rounded-l-md"
      >
        ←
      </button>
      <button 
        onClick={handleNextWeek}
        className="p-2 text-spring-green-400 hover:bg-gunmetal-300 rounded-r-md"
      >
        →
      </button>
    </div>
    <h2 className="text-xl font-semibold text-spring-green-400">{currentDate}</h2>
  </div>
</div>

        {/* Week View */}
        <div className="flex-1 overflow-auto p-4">
          <div className="bg-gunmetal-400/80 backdrop-blur-lg rounded-xl border border-office-green-500 shadow-xl h-full">
            {/* Week Header */}
            <div className="grid grid-cols-8 border-b border-office-green-500">
              <div className="p-2 text-center text-spring-green-400/50 text-xs"></div>
              {weekDays.map((day, i) => (
  <div key={i} className="p-2 text-center border-l border-office-green-500">
    <div className="text-xs text-spring-green-400/70 font-medium">{day}</div>
    <div className="h-10 flex items-center justify-center"> {/* Added fixed height container */}
      <div
  className={`text-lg font-medium text-spring-green-400 ${
    isToday(weekDates[i])
      ? "bg-emerald-200 rounded-full w-8 h-8 flex items-center justify-center"
      : "w-8 h-8 flex items-center justify-center"
  }`}
>
  {weekDates[i]}
</div>
    </div>
  </div>
))}
            </div>
    
                  {/* Time Grid */}
                  <div className="grid grid-cols-8">
                    {/* Time Labels */}
                    <div className="text-white/70">
                      {timeSlots.map((time, i) => (
                        <div key={i} className="h-20 border-b border-white/10 pr-2 text-right text-xs">
                          {time > 12 ? `${time - 12} PM` : `${time} AM`}
                        </div>
                      ))}
                    </div>

{/* Days Columns */}
{Array.from({ length: 7 }).map((_, dayIndex) => (
  <div key={dayIndex} className="border-l border-white/20 relative">
    {/* Meal slots at the top of each day */}
    <div className="absolute top-0 left-0 right-0 flex flex-col gap-2 p-2">
      {isLoading ? (
        <div className="text-spring-green-400/70 text-sm">Loading...</div>
      ) : (
        events
          .filter((event) => {
            const eventDate = new Date(event.date);
    const columnDate = new Date(currentDateObj);
    columnDate.setDate(weekDates[dayIndex]);
    return (
      eventDate.getDate() === columnDate.getDate() &&
      eventDate.getMonth() === columnDate.getMonth() &&
      eventDate.getFullYear() === columnDate.getFullYear()
    );
          })
          .sort((a, b) => {
            const mealOrder = { breakfast: 0, lunch: 1, dinner: 2 };
            return mealOrder[a.meal_type] - mealOrder[b.meal_type];
          })
          .map((event, i) => (
            <SpotlightCard
            key={i}
            className="w-full"
            spotlightColor="rgba(39, 251, 107, 0.2)"
          >
            <div
              className="bg-gunmetal-300 border-2 border-office-green-500 rounded-lg p-2 cursor-pointer hover:bg-emerald-500/20 transition-colors"
              onClick={() => setSelectedEvent(event)}  // Changed from handleEventClick to setSelectedEvent
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-spring-green-400/70">
                  {event.meal_type.toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-spring-green-400 truncate">
                {event.recipe.name}
              </h3>
            </div>
          </SpotlightCard>
          ))
      )}
    </div>
  </div>
))}
                  </div>
                </div>
              </div>
            </div>
    
            {/* Meal Modal */}
{selectedEvent && (
  <div
    className="fixed inset-0 bg-gunmetal-500/80 backdrop-blur-sm flex justify-center items-center z-50"
    onClick={() => setSelectedEvent(null)}
  >
    <SpotlightCard>
      <div
        className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-spring-green-400">
            {selectedEvent.recipe.name}
          </h2>
          <span className="text-xs text-spring-green-400/70 px-2 py-1 bg-gunmetal-400 rounded-full">
            {selectedEvent.meal_type.toUpperCase()}
          </span>
        </div>
        
        <div className="space-y-4 text-white">
          <div className="bg-gunmetal-400/50 rounded-lg p-4">
            <h3 className="text-spring-green-400 font-medium mb-2">Description</h3>
            <p>{selectedEvent.recipe.description}</p>
          </div>

          <div className="bg-gunmetal-400/50 rounded-lg p-4">
            <h3 className="text-spring-green-400 font-medium mb-2">Ingredients</h3>
            <ul className="list-disc list-inside">
              {selectedEvent.recipe.ingredients.map((ingredient, i) => (
                <li key={i}>{ingredient.name}</li>
              ))}
            </ul>
          </div>

          <div className="bg-gunmetal-400/50 rounded-lg p-4">
            <h3 className="text-spring-green-400 font-medium mb-2">Steps</h3>
            <p className="whitespace-pre-line">{selectedEvent.recipe.steps}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setSelectedEvent(null)}
            className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </SpotlightCard>
  </div>
)}
            </main>
        </div>
  )
}
