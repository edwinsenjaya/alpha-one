"use client";

import { useEffect, useRef } from "react";
import { logout } from "../firebase/authFunctions";

const IDLE_TIMEOUT = 60 * 60 * 1000;

export default function IdleLogoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      logout();
      alert("You have been logged out due to inactivity.");
    }, IDLE_TIMEOUT);
  };

  useEffect(() => {
    const activityEvents = ["mousemove", "keydown", "mousedown", "touchstart"];
    activityEvents.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );
    resetTimer(); // start timer

    return () => {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return <>{children}</>;
}
