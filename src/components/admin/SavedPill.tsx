export default function SavedPill({ text }: { text: string }) {
  return (
    <span className="saved-pill" role="status" aria-live="polite">
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M3 9.4L7.2 13.6L15 5.5"
          stroke="#b6e8c2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {text}
    </span>
  );
}
