import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../hooks/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (configured && !loading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [configured, loading, user, navigate]);

  if (!configured) {
    return (
      <div className="mx-auto max-w-md p-6 text-sm text-muted-foreground">
        Firebase is not configured yet. Copy <code>.env.example</code> to <code>.env</code>, fill in
        your Firebase web config, then reload.
      </div>
    );
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  }

  if (!user) return null;

  return children;
}
