import { useState, useEffect } from "react"
import backgroundImage from "../assets/layered-waves-haikei.svg"
import Navbar from "../components/Navbar"
import { useNavigate } from "react-router-dom"
import SpotlightCard from "../components/SpotlightCard"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"
import api from "../api"

export default function Calendar() {  // Changed from Home() to Calendar()
  const [isLoaded, setIsLoaded] = useState(false)
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
    created_by: number | null;
    created_by_ai: boolean;
    // Add missing recipe properties
    nationality?: string;
    cuisine_type?: string;
    cuisineType?: string;
    cooking_time?: string;
    cookingTime?: string;
    difficulty?: string;
    directions?: string;
  }


  type CalendarEvent = {
    id: number;
    recipe: Recipe;
    date: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    user: number;
  }
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [templateMeals, setTemplateMeals] = useState<CalendarEvent[]>([])
  const [draggedMeal, setDraggedMeal] = useState<CalendarEvent | null>(null)
  const [showAddMealModal, setShowAddMealModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMealType, setSelectedMealType] = useState('dinner')
  const [selectedTemplateMeal, setSelectedTemplateMeal] = useState<CalendarEvent | null>(null)
  const [isAddingMeal, setIsAddingMeal] = useState(false)

  // Add missing state variables
  const [userMeals, setUserMeals] = useState<CalendarEvent[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  // Month view specific states
  const [monthDates, setMonthDates] = useState<(number | null)[]>([])
  const monthDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]

  // Helper function to get month calendar dates
  const getMonthDates = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    
    // Get day of week for first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay()
    
    // Total days in month
    const daysInMonth = lastDay.getDate()
    
    // Create array with leading nulls for days before month starts
    const dates: (number | null)[] = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      dates.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(day)
    }
    
    return dates
  }

  // Navigation functions for month view
  const handlePreviousMonth = () => {
    const newDate = new Date(currentDateObj)
    newDate.setMonth(newDate.getMonth() - 1)
    
    setCurrentDateObj(newDate)
    setCurrentMonth(newDate.toLocaleString('default', { month: 'long', year: 'numeric' }))
    setCurrentDate(`${newDate.getDate()} ${newDate.toLocaleString('default', { month: 'long' })} ${newDate.getFullYear()}`)
    setMonthDates(getMonthDates(newDate))
  }

  const handleNextMonth = () => {
    const newDate = new Date(currentDateObj)
    newDate.setMonth(newDate.getMonth() + 1)
    
    setCurrentDateObj(newDate)
    setCurrentMonth(newDate.toLocaleString('default', { month: 'long', year: 'numeric' }))
    setCurrentDate(`${newDate.getDate()} ${newDate.toLocaleString('default', { month: 'long' })} ${newDate.getFullYear()}`)
    setMonthDates(getMonthDates(newDate))
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDateObj(today)
    setCurrentMonth(today.toLocaleString('default', { month: 'long', year: 'numeric' }))
    setCurrentDate(`${today.getDate()} ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`)
    setMonthDates(getMonthDates(today))
  }

  // Check if a date is today
  const isTodayDate = (date: number | null) => {
    if (!date) return false
    const today = new Date()
    const checkDate = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), date)
    
    return (
      today.getDate() === checkDate.getDate() &&
      today.getMonth() === checkDate.getMonth() &&
      today.getFullYear() === checkDate.getFullYear()
    )
  }

  // ...existing code for fetchMeals, fetchUserMeals, etc...

  const fetchMeals = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN)
      if (!token) {
        navigate('/login')
        return
      }

      // Filter out template meals from regular calendar events
      const response = await api.get('/api/meals/?exclude_templates=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })

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

  const fetchTemplateMeals = async () => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN)
      if (!token) {
        navigate('/login')
        return
      }

      // Fetch all meals for the user
      const response = await api.get('/api/meals/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      // Filter for template meals: no date and no meal_type
      const templateEvents: CalendarEvent[] = response.data
        .filter(meal => !meal.date && !meal.meal_type)
        .map(meal => ({
          id: meal.id,
          recipe: meal.recipe,
          date: meal.date,
          meal_type: meal.meal_type,
          user: meal.user
        }))

      setTemplateMeals(templateEvents)
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN)
        localStorage.removeItem(REFRESH_TOKEN)
        navigate('/login')
      } else {
        console.error('Error fetching template meals:', error)
      }
    }
  }

  // Initialize calendar with month view
  useEffect(() => {
    const initializeCalendar = async () => {
      setIsLoaded(true)
      
      const today = new Date()
      setCurrentMonth(today.toLocaleString('default', { month: 'long', year: 'numeric' }))
      setCurrentDate(`${today.getDate()} ${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`)
      setMonthDates(getMonthDates(today))

      await fetchMeals()
      await fetchTemplateMeals()
    }

    initializeCalendar()
  }, [])

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }

  const uniqueUserMeals = userMeals.filter((meal, index, self) =>
    index === self.findIndex((m) => m.recipe.name === meal.recipe.name)
  )

  // ...existing helper functions...
  const getCountryFlag = (nationality) => {
    if (!nationality) return '🌍';
    
    const countryFlags = {
      'italian': '🇮🇹',
      'mexican': '🇲🇽',
      'asian': '🥢',
      'american': '🇺🇸',
      'mediterranean': '🌊',
      'indian': '🇮🇳',
      'thai': '🇹🇭',
      'chinese': '🇨🇳',
      'french': '🇫🇷',
      'greek': '🇬🇷',
      'middle eastern': '🕌',
      'japanese': '🇯🇵',
      'korean': '🇰🇷',
      'spanish': '🇪🇸',
      'british': '🇬🇧',
      'german': '🇩🇪',
      'other': '🌍',
    };
    
    const normalizedNationality = nationality.toLowerCase().trim();
    return countryFlags[normalizedNationality] || '🌍';
  };

  const getDifficultyStars = (difficulty) => {
    const level = difficulty?.toLowerCase();
    switch(level) {
      case 'easy': 
      case 'beginner':
      case '1': return '⭐';
      case 'medium': 
      case 'intermediate':
      case '2': return '⭐⭐';
      case 'hard': 
      case 'difficult':
      case 'advanced':
      case '3': return '⭐⭐⭐';
      default: return '⭐';
    }
  };

  const formatCookingTime = (time) => {
    if (!time) return null;
    
    if (typeof time === 'string') {
      const lowerTime = time.toLowerCase();
      
      const hourMatch = lowerTime.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)/);
      if (hourMatch) {
        const hours = parseFloat(hourMatch[1]);
        if (hours >= 1) {
          return hours % 1 === 0 ? `${hours}h` : `${hours}h`;
        }
      }
      
      const minuteMatch = lowerTime.match(/(\d+)\s*(?:minutes?|mins?|m)/);
      if (minuteMatch) {
        const minutes = parseInt(minuteMatch[1]);
        if (minutes >= 60) {
          const hours = Math.floor(minutes / 60);
          const remainingMins = minutes % 60;
          return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
        }
        return `${minutes}m`;
      }
      
      const combinedMatch = lowerTime.match(/(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)/);
      if (combinedMatch) {
        const hours = parseInt(combinedMatch[1]);
        const minutes = parseInt(combinedMatch[2]);
        return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
      }
      
      const numberMatch = time.match(/\d+/);
      if (numberMatch) {
        const num = parseInt(numberMatch[0]);
        if (num >= 60) {
          const hours = Math.floor(num / 60);
          const remainingMins = num % 60;
          return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
        }
        return `${num}m`;
      }
    }
    
    if (typeof time === 'number') {
      if (time >= 60) {
        const hours = Math.floor(time / 60);
        const remainingMins = time % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
      }
      return `${time}m`;
    }
    
    return null;
  };

  const getRecipeMetadata = (recipe) => {
    const nationality = recipe.nationality || recipe.cuisine_type || recipe.cuisineType || null;
    const cookingTime = recipe.cooking_time || recipe.cookingTime || null;
    const difficulty = recipe.difficulty || null;
    
    return {
      nationality,
      cookingTime,
      difficulty
    };
  };

  // Handle double-click on saved recipe
  const handleRecipeDoubleClick = (recipe: Recipe, date?: string) => {
    setSelectedRecipe(recipe)
    setSelectedDate(date || new Date().toISOString().split('T')[0])
    setShowAddMealModal(true)
  }

  // Handle double-click on template meal
  const handleMealDoubleClick = (templateMeal: CalendarEvent, date?: string) => {
    setSelectedTemplateMeal(templateMeal)
    setSelectedDate(date || new Date().toISOString().split('T')[0])
    setShowAddMealModal(true)
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, templateMeal: CalendarEvent) => {
    setDraggedMeal(templateMeal)
    e.dataTransfer.effectAllowed = 'move'
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  }

  // Handle drop on calendar cell
  const handleDrop = (e: React.DragEvent, date: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (draggedMeal) {
      const dropDate = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), date);
      const dateString = dropDate.toISOString().split('T')[0];
      setSelectedTemplateMeal(draggedMeal);
      setSelectedDate(dateString);
      setShowAddMealModal(true);
      setDraggedMeal(null);
    }
  }

  // Add meal function (schedule template meal to specific date)
  const handleAddMeal = async () => {
    setIsAddingMeal(true)
    try {
      const token = localStorage.getItem(ACCESS_TOKEN)
      if (!token) {
        navigate('/login')
        return
      }

      // Create a new scheduled meal from the template
      await api.post('/api/meals/', {
        recipe_id: selectedTemplateMeal?.recipe.id,
        date: selectedDate,
        meal_type: selectedMealType,
        is_template: false
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      setShowAddMealModal(false)
      await fetchMeals() // Refresh the calendar
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN)
        navigate('/login')
      } else {
        console.error('Error adding meal:', error)
        alert('Failed to add meal')
      }
    } finally {
      setIsAddingMeal(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gunmetal-500">
      <img
        src={backgroundImage}
        alt="Background waves"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      <Navbar onSidebarChange={setIsSidebarOpen} />

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
    
      <main className="relative h-screen w-full flex">
        {/* Sidebar */}
        <div
          className={`w-64 h-full bg-gunmetal-400/80 backdrop-blur-lg p-4 shadow-xl border-r border-office-green-500 rounded-tr-3xl opacity-0 ${
            isLoaded ? "animate-fade-in" : ""
          } flex flex-col`}
          style={{ animationDelay: "0.4s" }}
        >
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-spring-green-400 font-medium mb-3">My Meals</h3>
            <div className="space-y-2">
              {templateMeals.map((meal, index) => {
                const metadata = getRecipeMetadata(meal.recipe);
                return (
                  <div
                    key={meal.id || index}
                    className="bg-gunmetal-300 border border-office-green-500 rounded-lg p-2 flex flex-col gap-2 hover:bg-emerald-500/20 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, meal)}
                    title="Drag to a specific day or add manually"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-spring-green-400 truncate mb-1">
                        {meal.recipe.name}
                      </h4>
                      <button
                        className="ml-1 flex-shrink-0 p-0.5 rounded-full bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                        style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Delete meal"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const token = localStorage.getItem(ACCESS_TOKEN);
                            await api.delete(`/api/meals/${meal.id}/`, {
                              headers: { 'Authorization': `Bearer ${token}` }
                            });
                            setTemplateMeals(templateMeals.filter(m => m.id !== meal.id));
                          } catch (err) {
                            alert('Failed to delete meal');
                          }
                        }}
                      >
                        {/* Small SVG bin icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="white" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6m4-6v6" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      {metadata.nationality && (
                        <span className="flex items-center gap-1">
                          {getCountryFlag(metadata.nationality)}
                        </span>
                      )}
                      {metadata.cookingTime && (
                        <span className="text-blue-300">
                          🕐 {formatCookingTime(metadata.cookingTime)}
                        </span>
                      )}
                      {metadata.difficulty && (
                        <span className="text-yellow-400">
                          {getDifficultyStars(metadata.difficulty)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <button
                        className="px-2 py-1 rounded bg-office-green-500 text-white text-xs hover:bg-emerald-500"
                        onClick={() => {
                          setSelectedTemplateMeal(meal);
                          setSelectedDate("");
                          setShowAddMealModal(true);
                        }}
                      >Add to Calendar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
    
        {/* Calendar View */}
        <div
          className={`flex-1 flex flex-col opacity-0 ${isLoaded ? "animate-fade-in" : ""}`}
          style={{ animationDelay: "0.6s" }}
        >
          {/* Calendar Controls */}
          <div className="flex items-center justify-between p-4 border-b border-office-green-500 flex-shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleToday}
                className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
              >
                Today
              </button>
              <div className="flex">
                <button 
                  onClick={handlePreviousMonth}
                  className="p-2 text-spring-green-400 hover:bg-gunmetal-300 rounded-l-md"
                >
                  ←
                </button>
                <button 
                  onClick={handleNextMonth}
                  className="p-2 text-spring-green-400 hover:bg-gunmetal-300 rounded-r-md"
                >
                  →
                </button>
              </div>
              <h2 className="text-xl font-semibold text-spring-green-400">{currentMonth}</h2>
            </div>
          </div>

          {/* Month View */}
          <div className="flex-1 p-4">
            <div className="bg-gunmetal-400/80 backdrop-blur-lg rounded-xl border border-office-green-500 shadow-xl h-full flex flex-col">
              {/* Month Header */}
              <div className="grid grid-cols-7 border-b border-office-green-500 flex-shrink-0">
                {monthDays.map((day, i) => (
                  <div key={i} className="p-3 text-center border-l border-office-green-500 first:border-l-0">
                    <div className="text-sm text-spring-green-400/70 font-medium">{day}</div>
                  </div>
                ))}
              </div>
    
              {/* Month Grid */}
              <div className="grid grid-cols-7 flex-1" style={{ gridTemplateRows: 'repeat(6, minmax(0, 1fr))' }}>
                {monthDates.map((date, index) => (
                  <div 
                    key={index} 
                    className="border-l border-b border-office-green-500/30 first:border-l-0 relative flex flex-col"
                    onDragOver={date ? handleDragOver : undefined}
                    onDrop={date ? (e) => handleDrop(e, date) : undefined}
                  >
                    {date && (
                      <>
                        {/* Date number */}
                        <div className="p-2 flex-shrink-0">
                          <div
                            className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${
                              isTodayDate(date)
                                ? "bg-emerald-500 text-white rounded-full"
                                : "text-spring-green-400"
                            }`}
                          >
                            {date}
                          </div>
                        </div>
                        
                        {/* Events for this date */}
                        <div className="px-1 pb-1 space-y-1 flex-1 overflow-hidden">
                          {isLoading ? (
                            <div className="text-xs text-spring-green-400/50">Loading...</div>
                          ) : (
                            events
                              .filter((event) => {
                                const eventDate = new Date(event.date);
                                const cellDate = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), date);
                                return (
                                  eventDate.getDate() === cellDate.getDate() &&
                                  eventDate.getMonth() === cellDate.getMonth() &&
                                  eventDate.getFullYear() === cellDate.getFullYear()
                                );
                              })
                              .sort((a, b) => {
                                const mealOrder = { breakfast: 0, lunch: 1, dinner: 2 };
                                return mealOrder[a.meal_type] - mealOrder[b.meal_type];
                              })
                              .slice(0, 3) // Show 3 events for more recipes
                              .map((event, i) => {
                                const metadata = getRecipeMetadata(event.recipe);
                                const mealTypeColors = {
                                  breakfast: 'bg-orange-500/20 border-orange-500/50',
                                  lunch: 'bg-blue-500/20 border-blue-500/50',
                                  dinner: 'bg-purple-500/20 border-purple-500/50'
                                };
                                const mealTypeIcons = {
                                  breakfast: '🌅',
                                  lunch: '☀️',
                                  dinner: '🌙'
                                };
                                const mealTypeLabels = {
                                  breakfast: 'Breakfast',
                                  lunch: 'Lunch',
                                  dinner: 'Dinner'
                                };
                                return (
                                  <div
                                    key={i}
                                    className={`${mealTypeColors[event.meal_type]} border rounded-md px-1.5 py-1 cursor-pointer hover:bg-emerald-500/20 transition-colors text-xs relative flex items-center`}
                                    onClick={() => setSelectedEvent(event)}
                                    title={`${mealTypeLabels[event.meal_type]}: ${event.recipe.name}`}
                                  >
                                    {/* Top row with meal type and metadata */}
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1">
                                          <span className="text-xs">{mealTypeIcons[event.meal_type]}</span>
                                          <span className="text-spring-green-400 text-xs font-medium">
                                            {mealTypeLabels[event.meal_type]}
                                          </span>
                                        </div>
                                        {/* Metadata in top-right */}
                                        <div className="flex items-center gap-1">
                                          {metadata.nationality && (
                                            <span className="text-xs">{getCountryFlag(metadata.nationality)}</span>
                                          )}
                                          {metadata.difficulty && (
                                            <span className="text-yellow-400 text-xs">{getDifficultyStars(metadata.difficulty)}</span>
                                          )}
                                          {metadata.cookingTime && (
                                            <span className="text-blue-300 text-xs">
                                              🕐{formatCookingTime(metadata.cookingTime)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      {/* Recipe name on single line */}
                                      <div className="text-spring-green-400 font-medium text-xs leading-tight truncate">
                                        {event.recipe.name}
                                      </div>
                                    </div>
                                    {/* Large bin button for deleting meal from calendar */}
                                    <button
                                      className="ml-1 flex-shrink-0 p-0.5 rounded-full bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
                                      style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      title="Delete from calendar"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        try {
                                          const token = localStorage.getItem(ACCESS_TOKEN);
                                          await api.delete(`/api/meals/${event.id}/`, {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                          });
                                          setEvents(events.filter(ev => ev.id !== event.id));
                                        } catch (err) {
                                          alert('Failed to delete meal from calendar');
                                        }
                                      }}
                                    >
                                      {/* Small SVG bin icon */}
                                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="white" className="w-3.5 h-3.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6m4-6v6" />
                                      </svg>
                                    </button>
                                  </div>
                                );
                              })
                          )}
                          {/* Show "+X more" if there are more than 3 events */}
                          {(() => {
                            const dayEvents = events.filter((event) => {
                              const eventDate = new Date(event.date);
                              const cellDate = new Date(currentDateObj.getFullYear(), currentDateObj.getMonth(), date);
                              return (
                                eventDate.getDate() === cellDate.getDate() &&
                                eventDate.getMonth() === cellDate.getMonth() &&
                                eventDate.getFullYear() === cellDate.getFullYear()
                              );
                            });
                            
                            if (dayEvents.length > 3) {
                              return (
                                <div 
                                  className="text-xs text-spring-green-400/70 px-1.5 py-1 bg-gunmetal-400/30 rounded-sm border border-office-green-500/30 cursor-pointer hover:bg-gunmetal-400/50 transition-colors"
                                  onClick={() => {
                                    // Show first event from the remaining ones
                                    const remainingEvents = dayEvents.slice(3);
                                    if (remainingEvents.length > 0) {
                                      setSelectedEvent(remainingEvents[0]);
                                    }
                                  }}
                                  title={`Click to see more meals for ${date}`}
                                >
                                  +{dayEvents.length - 3} more
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    
        {/* Meal Modal - keeping the existing modal code */}
        {selectedEvent && (
          <div
            className="fixed inset-0 bg-gunmetal-500/80 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={() => setSelectedEvent(null)}
          >
            <SpotlightCard>
              <div
                className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-spring-green-400 mb-3">
                      {selectedEvent.recipe.name}
                    </h2>
                    
                    {/* Recipe Info in Modal */}
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      {(() => {
                        const metadata = getRecipeMetadata(selectedEvent.recipe);
                        return (
                          <>
                            {metadata.nationality && (
                              <div 
                                className="flex items-center gap-2 bg-gunmetal-400/50 px-3 py-2 rounded-full cursor-help hover:bg-gunmetal-400/70 transition-colors"
                                title={`Cuisine: ${metadata.nationality}`}
                              >
                                <span className="text-xl">{getCountryFlag(metadata.nationality)}</span>
                                <span className="text-gray-300 text-sm capitalize font-medium">{metadata.nationality}</span>
                              </div>
                            )}
                            
                            {metadata.cookingTime && (
                              <div 
                                className="flex items-center gap-2 bg-blue-500/20 px-3 py-2 rounded-full"
                                title={`Cooking time: ${formatCookingTime(metadata.cookingTime)}`}
                              >
                                <span className="text-lg">🕐</span>
                                <span className="text-blue-300 text-sm font-medium">{formatCookingTime(metadata.cookingTime)}</span>
                              </div>
                            )}
                            
                            {metadata.difficulty && (
                              <div 
                                className="flex items-center gap-2 bg-yellow-500/20 px-3 py-2 rounded-full cursor-help hover:bg-yellow-500/30 transition-colors"
                                title={`Difficulty Level: ${metadata.difficulty}`}
                              >
                                <span className="text-yellow-400 text-lg">{getDifficultyStars(metadata.difficulty)}</span>
                                <span className="text-yellow-300 text-sm capitalize font-medium">{metadata.difficulty}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-2 rounded-full">
                              <span className="text-emerald-300 text-sm font-medium capitalize">{selectedEvent.meal_type}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 text-white">
                  <div className="bg-gunmetal-400/50 rounded-lg p-4">
                    <h3 className="text-spring-green-400 font-medium mb-2">Ingredients</h3>
                    <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-office-green-500 scrollbar-track-gunmetal-400">
                      <ul className="list-disc list-inside space-y-1">
                        {(() => {
                          try {
                            let ingredientsList: string[] = [];
                            
                            if (selectedEvent.recipe.description) {
                              const desc = selectedEvent.recipe.description.trim();
                              
                              if (desc.startsWith('[') && desc.includes('"')) {
                                const cleanedDesc = desc
                                  .replace(/^\[/, '')
                                  .replace(/\]$/, '')
                                  .replace(/^"/, '')
                                  .replace(/"$/, '')
                                  .replace(/\\"/g, '"')
                                  .replace(/", "/g, '|SPLIT|')
                                  .replace(/","/g, '|SPLIT|')
                                  .replace(/",$/, '')
                                  .replace(/^"/, '');
                                
                              ingredientsList = cleanedDesc
                                .split('|SPLIT|')
                                .map((ingredient: string) => ingredient.replace(/^"|"$/g, '').trim())
                                .filter((ingredient: string) => ingredient.length > 0 && ingredient !== '""');
                              }
                            }
                            
                            if (ingredientsList.length === 0 && selectedEvent.recipe.ingredients && selectedEvent.recipe.ingredients.length > 0) {
                              ingredientsList = selectedEvent.recipe.ingredients.map((ingredient: any) => {
                                if (typeof ingredient === 'string') {
                                  return ingredient;
                                }
                                // Only use name, as quantity/preparation may not exist
                                return ingredient.name || '';
                              });
                            }
                            
                            if (ingredientsList.length > 0) {
                              return ingredientsList.map((ingredient, idx) => (
                                <li key={idx} className="text-white">
                                  {ingredient}
                                </li>
                              ));
                            }
                            
                            return <li className="text-white">No ingredients available.</li>;
                          } catch (error) {
                            console.error('Error parsing ingredients:', error);
                            if (selectedEvent.recipe.ingredients && selectedEvent.recipe.ingredients.length > 0) {
                              return selectedEvent.recipe.ingredients.map((ingredient, idx) => (
                                <li key={idx} className="text-white">
                                  {typeof ingredient === 'string' ? ingredient : ingredient.name || 'Unknown ingredient'}
                                </li>
                              ));
                            }
                            return <li className="text-white">Unable to parse ingredients.</li>;
                          }
                        })()}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gunmetal-400/50 rounded-lg p-4">
                    <h3 className="text-spring-green-400 font-medium mb-2">Instructions</h3>
                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-office-green-500 scrollbar-track-gunmetal-400">
                      {(() => {
                        try {
                          let directionsList: string[] = [];
                          
                          if (selectedEvent.recipe.directions) {
                            const dirs = selectedEvent.recipe.directions.trim();
                            
                            if (dirs.startsWith('[') && dirs.includes('"')) {
                              const cleanedDirs = dirs
                                .replace(/^\[/, '')
                                .replace(/\]$/, '')
                                .replace(/^"/, '')
                                .replace(/"$/, '')
                                .replace(/\\"/g, '"')
                                .replace(/", "/g, '|SPLIT|')
                                .replace(/","/g, '|SPLIT|')
                                .replace(/",$/, '')
                                .replace(/^"/, '');
                              
                              directionsList = cleanedDirs
                                .split('|SPLIT|')
                                .map((direction: string) => direction.replace(/^"|"$/g, '').trim())
                                .filter((direction: string) => direction.length > 0 && direction !== '""');
                            }
                          }
                          
                          if (directionsList.length === 0 && selectedEvent.recipe.steps) {
                            if (typeof selectedEvent.recipe.steps === 'string') {
                              directionsList = selectedEvent.recipe.steps
                                .split(/(?<=[.!?])\s+(?=[A-Z])|(?<=\.)\s*\d+\.\s*/)
                                .filter((step: string) => step.trim().length > 10);
                            } else if (Array.isArray(selectedEvent.recipe.steps)) {
                              directionsList = selectedEvent.recipe.steps as string[];
                            }
                          }
                          
                          if (directionsList.length > 0) {
                            return (
                              <div className="space-y-3">
                                {directionsList.map((direction, idx) => (
                                  <div key={idx} className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-emerald-500 text-white text-sm font-bold rounded-full flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    <div className="text-white leading-relaxed">
                                      {typeof direction === 'string' ? direction.replace(/^\d+\.\s*/, '').trim() : ''}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          
                          return <div className="text-white">No instructions available.</div>;
                        } catch (error) {
                          console.error('Error parsing directions:', error);
                          return <div className="text-white">Unable to parse instructions.</div>;
                        }
                      })()}
                    </div>
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

        {/* Add Meal Modal */}
        {showAddMealModal && selectedTemplateMeal && (
          <div
            className="fixed inset-0 bg-gunmetal-500/80 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={() => setShowAddMealModal(false)}
          >
            <SpotlightCard>
              <div
                className="bg-gunmetal-300 rounded-lg shadow-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold text-spring-green-400 mb-4">
                  Schedule Meal
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gunmetal-400/50 rounded-lg p-3">
                    <h4 className="text-spring-green-400 font-medium mb-1">Recipe:</h4>
                    <p className="text-white">{selectedTemplateMeal.recipe.name}</p>
                  </div>

                  {/* Only show date input if selectedDate is empty (not set by drag-and-drop) */}
                  {(!selectedDate || selectedDate === "") && (
                    <div>
                      <label className="block text-spring-green-400 text-sm font-bold mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-spring-green-400 text-sm font-bold mb-2">
                      Meal Type
                    </label>
                    <select
                      value={selectedMealType}
                      onChange={(e) => setSelectedMealType(e.target.value)}
                      className="w-full px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setShowAddMealModal(false)}
                    className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMeal}
                    disabled={isAddingMeal}
                    className="px-4 py-2 rounded-full border-2 border-office-green-500 bg-gunmetal-400 text-white hover:bg-emerald-500 hover:border-emerald-500 transition-colors disabled:opacity-50"
                  >
                    {isAddingMeal ? 'Scheduling...' : 'Schedule Meal'}
                  </button>
                </div>
              </div>
            </SpotlightCard>
          </div>
        )}

        {/* Removed duplicate My Meals from top right */}
      </main>
    </div>
  )
}