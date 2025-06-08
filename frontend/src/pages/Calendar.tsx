"use client"

import { useState, useEffect } from "react"
import backgroundImage from "../assets/layered-waves-haikei.svg"
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"
import SpotlightCard from "../components/SpotlightCard"


export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [showAIPopup, setShowAIPopup] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentView, setCurrentView] = useState("week")
  const [currentMonth, setCurrentMonth] = useState("March 2025")
  const [currentDate, setCurrentDate] = useState("March 5")
  const navigate = useNavigate()
  type CalendarEvent = {
    id: number
    title: string
    startTime: string
    endTime: string
    color: string
    day: number
    description: string
    location: string
    attendees: string[]
    organizer: string
  }
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  useEffect(() => {
    setIsLoaded(true)

    // Show AI popup after 3 seconds
    const popupTimer = setTimeout(() => {
      setShowAIPopup(true)
    }, 3000)

    return () => clearTimeout(popupTimer)
  }, [])

  const handleEventClick = (event) => {
    setSelectedEvent(event)
  }

  // Updated sample calendar events with all events before 4 PM
 const events = [
    
  ] 

  // Sample calendar days for the week view
  const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const weekDates = [3, 4, 5, 6, 7, 8, 9]
  const timeSlots = Array.from({ length: 9 }, (_, i) => i + 8) // 8 AM to 4 PM

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

  const togglePlay = () => {
    setIsPlaying(!isPlaying)
    // Here you would typically also control the actual audio playback
  }

  return (
    <div className="relative min-h-screen bg-gunmetal-500">
    {/* Background Image */}
    <img
      src={backgroundImage}
      alt="Background waves"
      className="absolute inset-0 w-full h-full object-cover"
    />
    
          {/* Navigation */}
          <Navbar />

          {/* Back Button */}
    <button
      onClick={() => navigate("/")}
      className="absolute top-4 left-20 text-spring-green-400 hover:text-emerald-500 font-semibold transition-colors flex items-center gap-2 z-50"
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
              <div className="flex gap-1">
                <button className="p-1 rounded-full hover:bg-gunmetal-300 text-spring-green-400">←</button>
                <button className="p-1 rounded-full hover:bg-gunmetal-300 text-spring-green-400">→</button>
              </div>
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
    
              {/* Create button */}
              <button className="mt-6 flex items-center justify-center gap-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 hover:bg-emerald-500 hover:border-emerald-500 transition-colors p-4 text-white w-14 h-14 self-start">
          <span className="text-xl">+</span>
        </button>
      </div>
    
            {/* Calendar View */}
            <div
        className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
        style={{ animationDelay: "0.6s" }}
      >
              {/* Calendar Controls */}
        <div className="flex items-center justify-between p-4 border-b border-office-green-500">
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors">
              Today
            </button>
            <div className="flex">
              <button className="p-2 text-spring-green-400 hover:bg-gunmetal-300 rounded-l-md">←</button>
              <button className="p-2 text-spring-green-400 hover:bg-gunmetal-300 rounded-r-md">→</button>
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
                  <div
                    className={`text-lg font-medium mt-1 text-spring-green-400 ${
                      weekDates[i] === 5
                        ? "bg-emerald-500 rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                        : ""
                    }`}
                  >
                    {weekDates[i]}
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
                        {timeSlots.map((_, timeIndex) => (
                          <div key={timeIndex} className="h-20 border-b border-white/10"></div>
                        ))}
    
                        {/* Events */}
                        {events
  .filter((event) => event.day === dayIndex + 1)
  .map((event, i) => {
    const eventStyle = calculateEventStyle(event.startTime, event.endTime)
    return (
      <SpotlightCard
        key={i}
        className="absolute"
        spotlightColor="rgba(39, 251, 107, 0.2)"
        style={{
          ...eventStyle,
          left: "4px",
          right: "4px",
        }}
      >
        <div
          className="bg-gunmetal-300 border-2 border-office-green-500 rounded-lg p-2 cursor-pointer hover:bg-emerald-500/20 transition-colors w-full h-full"
          onClick={() => handleEventClick(event)}
        >
          <h3 className="text-lg font-bold text-spring-green-400 truncate">
            {event.title}
          </h3>
          <p className="text-white text-xs opacity-80">
            {`${event.startTime} - ${event.endTime}`}
          </p>
          <p className="text-white text-xs truncate mt-1">
            {event.location}
          </p>
        </div>
      </SpotlightCard>
    )
  })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
    
            {/* Event Modal */}
              {selectedEvent && (
  <div
    className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50 transition-opacity duration-300"
    onClick={() => setSelectedEvent(null)}
  >
    <SpotlightCard>
      <div
        className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-spring-green-400 mb-4">
          {selectedEvent.title}
        </h2>
        <div className="space-y-3 text-white">
          <p className="flex items-center">
            <span className="mr-2">🕐</span>
            {`${selectedEvent.startTime} - ${selectedEvent.endTime}`}
          </p>
          <p className="flex items-center">
            <span className="mr-2">📍</span>
            {selectedEvent.location}
          </p>
          <p className="flex items-center">
            <span className="mr-2">📅</span>
            {`${weekDays[selectedEvent.day - 1]}, ${weekDates[selectedEvent.day - 1]} ${currentMonth}`}
          </p>
          <p className="flex items-start">
            <span className="mr-2 mt-1">👥</span>
            <span>
              <strong className="text-spring-green-400">Attendees:</strong>
              <br />
              {selectedEvent.attendees.join(", ") || "No attendees"}
            </span>
          </p>
          <p>
            <strong className="text-spring-green-400">Organizer:</strong>{" "}
            {selectedEvent.organizer}
          </p>
          <p>
            <strong className="text-spring-green-400">Description:</strong>{" "}
            {selectedEvent.description}
          </p>
        </div>
        <div className="flex justify-end mt-6">
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
