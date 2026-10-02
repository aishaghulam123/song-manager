import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import AuthForm from "../components/AuthForm";
import { signUp } from "../lib/auth";
import { useAuth } from "../hooks/useAuth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account | Wedding Song Manager" },
      {
        name: "description",
        content: "Create an account for the wedding invitation song management tool.",
      },
      { property: "og:title", content: "Create account | Wedding Song Manager" },
      {
        property: "og:description",
        content: "Create an account for the wedding invitation song management tool.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { user, loading, configured } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4 py-10">
      <h1 className="text-xl font-semibold text-foreground">Song Manager</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">Create your account.</p>

      {!configured ? (
        <p className="text-sm text-muted-foreground">
          Firebase is not configured yet. Add your Firebase web config to a <code>.env</code> file.
        </p>
      ) : loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <AuthForm
          mode="signup"
          onSubmit={async (email, password) => {
            await signUp(email, password);
            navigate({ to: "/", replace: true });
          }}
          footer={
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-foreground underline">
                Login
              </Link>
            </p>
          }
        />
      )}
    </main>
  );
}
