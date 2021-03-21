import { createContext, useEffect } from "react";

const initialState = {
  theme: "light",
  toggle: () => {},
};

const ThemeContext = createContext("light");

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const toggle = (e) => {
    const theme = e;
    setTheme(theme);
  };
};
