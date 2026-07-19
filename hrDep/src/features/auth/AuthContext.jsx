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

  // Fired by the axios interceptor when a silent token refresh fails — the session
  // is genuinely gone, so drop to "anonymous" here rather than leaving whatever
  // page the user was on stuck with a raw 401 error and no way out.
  useEffect(() => {
    function handleSessionExpired() {
      dispatch({ type: "SET_USER", user: null });
    }
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    dispatch({ type: "SET_USER", user: res.data.user });
    return res.data.user;
  }, []);

  const signup = useCallback(async (data) => {
    const res = await api.post("/auth/signup", data);
    dispatch({ type: "SET_USER", user: res.data.user });
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    await api.post("/auth/logout");
    dispatch({ type: "SET_USER", user: null });
  }, []);

  const setUser = useCallback((user) => dispatch({ type: "SET_USER", user }), []);

  return <AuthContext.Provider value={{ ...state, login, signup, logout, setUser }}>{children}</AuthContext.Provider>;
}
