import React from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Home from "./components/Home/Home";
import CollaborativeCanvas from "./components/Canvas/CollaborativeCanvas";
import QuestionGenerator from "./components/Features/QuestionGenerator";
import PPTSummarizer from "./components/Features/PPTSummarizer";
import WebScraper from "./components/Features/WebScraper";
import ProtectedRoute from "./components/Common/ProtectedRoute";
import Navbar from "./components/Common/Navbar";
import Landing from "./components/Pages/Landing";
import About from "./components/Pages/About";

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/room/:id"
            element={
              <ProtectedRoute>
                <CollaborativeCanvas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/questions"
            element={
              <ProtectedRoute>
                <QuestionGenerator />
              </ProtectedRoute>
            }
          />
          <Route
            path="/summarize"
            element={
              <ProtectedRoute>
                <PPTSummarizer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/scrape"
            element={
              <ProtectedRoute>
                <WebScraper />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
