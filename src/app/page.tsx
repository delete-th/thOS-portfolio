// Entry point → Boot → Login → Desktop.
// Replaced incrementally as the boot sequence, login screen, and desktop
// components land (see thOS-portfolio-spec.md § Build order).
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-900 text-zinc-100 font-mono">
      <p>thOS — scaffold ready. Build order starts with the Window component.</p>
    </main>
  );
}
