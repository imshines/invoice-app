import React from "react";

const ToggleContext = React.createContext("true");

const ToggleProvider = ({ children }) => {
  const [toggle, setToggle] = React.useState(true);
  const toggleFunction = () => {
    setToggle(!toggle);
  };
  console.log(toggle);
  return (
    <ToggleContext.Provider value={{ toggle, toggleFunction }}>{children}</ToggleContext.Provider>
  );
};

export { ToggleContext, ToggleProvider };
