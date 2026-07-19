import { useEffect, useReducer, useCallback } from "react";
import { api } from "../../api/axiosClient";
import { AuthContext } from "./auth-context";

const initialState = { user: null, status: "loading" }; // status: loading | authenticated | anonymous

function reducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return { user: action.user, status: action.user ? "authenticated" : "anonymous" };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => dispatch({ type: "SET_USER", user: res.data.user }))
      .catch(() => dispatch({ type: "SET_USER", user: null }));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    dispatch({ type: "SET_USER", user: res.data.user });
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    dispatch({ type: "SET_USER", user: null });
  }, []);

  const setUser = useCallback((user) => dispatch({ type: "SET_USER", user }), []);

  return <AuthContext.Provider value={{ ...state, login, logout, setUser }}>{children}</AuthContext.Provider>;
}
