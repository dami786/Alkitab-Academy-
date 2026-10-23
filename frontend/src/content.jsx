import { createContext, useContext, useEffect, useState } from "react";
import { getContent } from "./api";

const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState("");

  const reload = () =>
    getContent()
      .then((data) => {
        setContent(data);
        setError("");
        return data;
      })
      .catch(() => {
        setError("The website could not reach the server. Start the backend and refresh this page.");
      });

  useEffect(() => {
    reload();
  }, []);

  return <ContentContext.Provider value={{ content, error, reload }}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}
