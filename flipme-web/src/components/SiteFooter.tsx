const feedbackUrl = process.env.NEXT_PUBLIC_FEEDBACK_URL;

export default function SiteFooter() {
  return (
    <footer className="border-t border-flip-muted/15 bg-white/60 py-8 text-center text-sm text-flip-muted">
      <p className="text-flip-primary">Made with ♪ by FlipMe</p>
      {feedbackUrl ? (
        <a
          href={feedbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block rounded-md font-medium text-flip-accent outline-none hover:underline focus-visible:ring-2 focus-visible:ring-flip-accent focus-visible:ring-offset-2 focus-visible:ring-offset-flip-surface"
        >
          피드백 보내기
        </a>
      ) : null}
    </footer>
  );
}
