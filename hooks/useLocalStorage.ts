"use client";
import { useState } from "react";

export function useLocalStorage<T>(
  key: string, 
  initialValue: T,
  migrateFn?: (value: T) => T
) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsedItem = JSON.parse(item);
        return migrateFn ? migrateFn(parsedItem) : parsedItem;
      }
      return initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = (
    value: T | ((val: T) => T)
  ) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error saving data to localStorage:", error);
    }
  };

  return [storedValue, setValue] as const;
}
