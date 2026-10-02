import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import AuthForm from "../components/AuthForm";
import { logIn } from "../lib/auth";
import { useAuth } from "../hooks/useAuth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login | Wedding Song Manager" },
      {
        name: "description",
        content: "Sign in to manage the background songs for your wedding invitations.",
      },
      { property: "og:title", content: "Login | Wedding Song Manager" },
      {
        property: "og:description",
        content: "Sign in to manage the background songs for your wedding invitations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-xl font-semibold text-foreground">Song Manager</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Log in to continue.</p>

      {!configured ? (
        <p className="text-sm text-muted-foreground">
          Firebase is not configured yet. Add your Firebase web config to a <code>.env</code> file.
        </p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <AuthForm
          mode="login"
          onSubmit={async (email, password) => {
            await logIn(email, password);
            navigate({ to: "/", replace: true });
          }}
          footer={
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-foreground underline">
                Create an account
              </Link>
            </p>
          }
        />
      )}
    </main>
  );
}
