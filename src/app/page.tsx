import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Simplify & Summarize
          </h1>
          <nav className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-4 py-24">
        <div className="text-center">
          <h2 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
            Make your content accessible
            <br />
            to everyone
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Add a widget to your website that lets visitors simplify or summarize
            any page. Pre-processed content means instant responses.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100">
                  Start Free Trial
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
              >
                Go to Dashboard
              </Link>
            </SignedIn>
          </div>
        </div>

        {/* Features */}
        <div className="mt-32 grid gap-8 sm:grid-cols-3">
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Instant Responses
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Content is pre-processed at setup. Visitors get responses in under 50ms.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              QA Before Launch
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Review and approve all simplified content before it goes live.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white">
              Easy Integration
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Add one script tag. Widget appears automatically on your pages.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
