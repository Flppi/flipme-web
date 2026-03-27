import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="border-b border-flip-muted/15 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center px-4 py-4 sm:px-6 lg:max-w-5xl">
        <Link
          href="/"
          className="rounded-md font-display text-xl font-semibold tracking-tight text-flip-primary outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 focus-visible:ring-offset-flip-surface"
        >
          FlipMe
        </Link>
      </div>
    </header>
  );
}
