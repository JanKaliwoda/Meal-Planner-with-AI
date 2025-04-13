# 🧠 Meal Planner with AI

## 📌 Project Overview

**Meal Planner with AI** is a web application designed to help users plan meals, generate recipes based on available ingredients, and create shopping lists. By analyzing user input such as dietary preferences, available ingredients, and health goals, the app leverages Artificial Intelligence (AI) to suggest personalized recipe ideas. It integrates a modern tech stack across frontend, backend, and AI services to deliver an efficient and tailored meal planning experience.

---

## 👥 Team & Roles

- **Frontend Developer – Szymon Pietraszewski**  
  Designs the user interface including forms for ingredient input, recipe display, shopping list management, and frontend-backend integration using React, HTML, CSS, and JavaScript.

- **Backend Developer – Jan Kaliwoda**  
  Develops application logic and RESTful API using Django. Manages user registration, ingredient storage, AI-powered recipe generation, and database integration.

- **AI Developer – Maciej Paliszewski**  
  Integrates AI models (e.g., OpenAI GPT-3) to generate personalized recipes based on user-provided ingredients.

- **DevOps / Fullstack Developer – Kacper Rogowski - Project Manager**  
  Handles deployment, CI/CD configuration, containerization, and cloud hosting (e.g., Heroku, AWS). Maintains documentation and implements testing for application stability.

---

## 🎯 Functional Features

- **User Registration & Login**  
  Create an account and set dietary preferences and allergies.

- **Ingredient Management**  
  Add ingredients manually or via barcode scanner (optional).

- **AI-Powered Recipe Generation**  
  Generate recipes using GPT-3 based on the user's current ingredients.

- **Meal Planning**  
  Plan meals across selected days using AI recommendations.

- **Shopping List Creation**  
  Automatically generate a shopping list based on selected recipes.

- **Smart Recommendations**  
  Suggest recipes based on user history and preferences.

- **Google Vision API Integration** *(optional)*  
  Recognize ingredients through photos.

---

## 🏗️ Architecture Overview

The application follows a three-layer architecture:

- **Frontend (Presentation Layer)**  
  Built using React (or vanilla JavaScript), communicates with the backend via REST API. Includes user forms and interactive UI components.

- **Backend (Logic Layer)**  
  Developed with Django and Django REST Framework. Handles user auth, logic processing, database operations, and AI integrations.

- **Database (Data Layer)**  
  PostgreSQL or MongoDB stores user data, ingredients, recipes, and meal history.

- **AI Module**  
  Uses GPT-3 to generate recipes and recommendations based on input data. Optional support for custom models.

---

## 🛠️ Tech Stack

| Area        | Technology             |
|-------------|------------------------|
| Frontend    | React, HTML, CSS, JS   |
| Backend     | Django, Django REST    |
| Database    | PostgreSQL / MongoDB   |
| AI          | OpenAI GPT-3           |
| Image AI    | Google Vision API *(optional)* |
| Deployment  | Docker, Heroku / AWS   |
| DevOps      | Docker, CI/CD          |

---

## ⚙️ System Modules

### 👤 User Module
- Handles account registration, login, and dietary settings.

### 🧺 Ingredients Module
- Stores and manages user-inputted ingredients.

### 🍽️ Recipe Generation Module
- Uses GPT-3 to create recipes and communicates results via API.

---

## 🚀 How to Use

1. **Register/Login**  
   Create an account, define your dietary preferences and allergies.

2. **Add Ingredients**  
   Add what you have at home manually or by scanning (optional).

3. **Generate Recipes**  
   Use the ingredient list to generate step-by-step recipes and shopping lists.

4. **Plan Meals**  
   Select recipes and schedule them for the week.

5. **Create Shopping List**  
   Automatically generate a list of required items based on selected meals.

---
