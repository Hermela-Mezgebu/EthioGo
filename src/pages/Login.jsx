import { useState } from "react"
import { Plane } from "lucide-react"

import { loginUser } from "../services/auth"

function Login({
  onLogin,
  onSignup,
  onBack,
}) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()

    setError("")

    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    try {
      setLoading(true)

      const user = loginUser({
        email,
        password,
      })

      onLogin(user)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="mb-6 text-sm text-neutral-muted hover:text-neutral"
        >
          ← Back to home
        </button>

        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white">
              <Plane size={24} />
            </div>

            <h1 className="text-2xl font-bold text-neutral">
              Welcome back
            </h1>

            <p className="mt-2 text-sm text-neutral-muted">
              Login to your EthioFlight dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="you@example.com"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-neutral">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter your password"
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-muted">
            Don't have an account?{" "}
            <button
              onClick={onSignup}
              className="font-semibold text-primary hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login