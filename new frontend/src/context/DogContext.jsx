// src/context/DogContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const DogContext = createContext(null);

export function DogProvider({ children }) {
  const [dogs, setDogs] = useState([]);
  const [activeDogId, setActiveDogId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/dogs")
      .then((res) => {
        setDogs(res.data);
        if (res.data.length) setActiveDogId(res.data[0].id);
      })
      .catch(() => setDogs([]))
      .finally(() => setLoading(false));
  }, []);

  const activeDog = dogs.find((d) => d.id === activeDogId) || null;

  return (
    <DogContext.Provider value={{ dogs, activeDog, activeDogId, setActiveDogId, loading }}>
      {children}
    </DogContext.Provider>
  );
}

export const useDogs = () => useContext(DogContext);
