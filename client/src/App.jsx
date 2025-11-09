// client/src/App.jsx
/**
 * @purpose Initializes the main application structure, setting up global routing and authentication.
 * It defines routes for login and protected dashboard areas, wrapping the application with an authentication provider.
 */

import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import AppContent from "./AppContent";
import "./App.css";

// Material-UIテーマの作成
const theme = createTheme({
  typography: {
    fontFamily: "Figtree, sans-serif",
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: "Figtree, sans-serif",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AuthProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
