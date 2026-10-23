import { createContext, useContext, useEffect, useState } from "react";
import { defaultSettings } from "../../backend/src/defaults.js";
import { getContent } from "./api";

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [content, setContent] = useState(defaultSettings);
  const [error, setError] = useState("");

  const reload = () =>
    getContent()
      .then((data) => {
        if (data && typeof data === "object") setContent({ ...defaultSettings, ...data });
        setError("");
        return data;
      })
      .catch(() => {});

  useEffect(() => {
    reload();
  }, []);

  return <ContentContext.Provider value={{ content, error, reload }}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}
