import { createContext, useState } from "react";

export const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("user:token");
    const username = localStorage.getItem("user:username");
    const userObj = token && username ? { token, username } : null;
    console.log("AuthContext: Initial user state", userObj);
    return userObj;
  });

  const login = (userData) => {
    console.log("AuthContext: Login called with", userData);
    localStorage.setItem("user:token", userData.token);
    localStorage.setItem("user:username", userData.username);
    const userObj = { token: userData.token, username: userData.username };
    console.log("AuthContext: Setting user to", userObj);
    setUser(userObj);
  };

  const logout = () => {
    localStorage.removeItem("user:token");
    localStorage.removeItem("user:username");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
