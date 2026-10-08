import { useContext } from "react";
import { GuestContext } from "./GuestContext.js";

export function useGuest() {
  const context = useContext(GuestContext);

  if (!context) {
    throw new Error(
      "useGuest must be used inside a GuestProvider"
    );
  }

  return context;
}