#Folder Structure

CUBIE/
│
├── client/ # React frontend application
│ ├── public/ # Static files such as favicon, robots.txt, etc.
│ ├── src/ # Main source code directory
│ │ ├── assets/ # Assets like images, fonts, and styles
│ │ ├── components/ # Reusable UI components (e.g., buttons, cards)
│ │ ├── context/ # Global state management using React Context API (e.g., UserContext)
│ │ ├── hooks/ # Custom React hooks (e.g., useAuth)
│ │ ├── pages/ # Page-level components (e.g., Home.jsx, Login.jsx)
│ │ ├── routes/ # React Router configuration
│ │ ├── services/ # API requests and external service handlers
│ │ ├── App.css # Global app styles
│ │ ├── App.jsx # Main component defining routing and shared layout
│ │ ├── index.css # Base CSS settings (reset styles and utility classes)
│ │ └── main.jsx # Entry point for Vite; renders App.jsx via ReactDOM
│ ├── .env # Environment variables for frontend (must start with VITE\_)
│ ├── eslint.config.js # ESLint configuration file for code quality
│ ├── index.html # HTML file for mounting the React app (used by Vite)
│ ├── package.json # Defines frontend dependencies and scripts
│ ├── README.md # Documentation for the frontend
│ └── vite.config.js # Configuration file for Vite (build and dev server settings)
│
├── server/ # Node.js + Express backend application
│ ├── config/ # Environment and database configuration (e.g., mongoose.connect)
│ ├── controllers/ # Logic for handling specific API routes (e.g., UserController.js)
│ ├── middlewares/ # Common request preprocessing (e.g., auth, validation, error handling)
│ ├── models/ # Database schemas and models (e.g., User.js, Event.js)
│ ├── routes/ # API endpoint definitions and routing (e.g., /api/users)
│ ├── services/ # Business logic and external service integrations
│ ├── utils/ # Reusable utility functions (e.g., token generation, formatting)
│ ├── .env # Environment variables for backend (e.g., DB URI, JWT secret)
│ ├── app.js # Express app setup (routing and middleware configuration)
│ ├── package.json # Defines backend dependencies and scripts
│ └── server.js # Entry point for starting the Express server (loads app.js and listens)
│
├── chat-server/ # Backend for real-time chat functionality
│ ├── config/ # Database connections and environment settings
│ ├── controllers/ # Logic for processing API requests
│ ├── middlewares/ # Common pre-processing like authentication
│ ├── models/ # Database schema definitions
│ ├── routes/ # API endpoints and routing
│ ├── services/ # Core real-time communication logic, including Socket.IO
│ ├── utils/ # Reusable helper functions
│ ├── .env # Environment variables file
│ ├── app.js # Express app basic setup
│ ├── package.json # Dependencies and scripts
│ └── server.js # Server entry point
│
├── package-lock.json #　 ensures consistent, locked dependency versions across your entire monorepo.
├── package.json # Shared dependencies for monorepo setup (used by both client and server)
├── README.md # Overview and setup instructions for the entire project
└── .gitignore # Files and folders to be ignored by Git (e.g., node_modules, .env)
