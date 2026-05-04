import Link from 'next/link';

export default function PublicHomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-surface-100 p-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand" />
        <h1 className="mt-4 text-xl font-medium text-foreground">CSE Alumni Portal</h1>
        <p className="mt-1 text-sm text-foreground-light">Computer Systems Engineering</p>
        <div className="mt-8 flex gap-3">
          <Link
            className="flex-1 rounded-full bg-brand px-4 py-2 text-center text-sm font-medium text-foreground-contrast transition-colors duration-150 hover:bg-brand-600"
            href="/auth/register"
          >
            Register
          </Link>
          <Link
            className="flex-1 rounded-md border border-border-secondary bg-button px-4 py-2 text-center text-sm font-medium text-foreground transition-colors duration-150 hover:border-border-strong hover:bg-surface-300"
            href="/auth/login"
          >
            Sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
