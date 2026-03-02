export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100 px-4">
      <main className="w-full max-w-md rounded-2xl border border-border bg-white p-8 shadow-lg sm:p-10">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl">
            🌿
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900">
            Perennial Park
          </h1>
          <p className="text-muted-foreground text-sm">
            <span className="font-semibold text-foreground">Community portal</span>
            <br />
            Sign in or register to continue
          </p>
          <div className="flex w-full flex-col gap-3 mt-8">
            <a
              href="/sign-in"
              className="w-full rounded-lg bg-emerald-600 px-6 py-2.5 text-center font-medium text-white transition-colors hover:bg-emerald-700"
            >
              Sign In
            </a>
            <p className="text-center text-sm text-muted-foreground">
              New member?{" "}
              <a
                href="/register"
                className="font-medium text-emerald-600 underline hover:text-emerald-700"
              >
                Register
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
