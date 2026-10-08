import { useState } from "react";
import { GuestContext } from "./GuestContext.js";

export function GuestProvider({ children }) {
  const [guestData, setGuestData] = useState({
    budget: null,
    expenseSplit: null,
    savingsGoal: null,
    budgetRule: null,
    monthlyPlanner: null,
    financialHealth: null,
  });

  const saveGuestData = (key, data) => {
    setGuestData((currentData) => ({
      ...currentData,
      [key]: data,
    }));
  };

  const clearGuestData = () => {
    setGuestData({
      budget: null,
      expenseSplit: null,
      savingsGoal: null,
      budgetRule: null,
      monthlyPlanner: null,
      financialHealth: null,
    });
  };

  return (
    <GuestContext.Provider
      value={{
        guestData,
        saveGuestData,
        clearGuestData,
      }}
    >
      {children}
    </GuestContext.Provider>
  );
}