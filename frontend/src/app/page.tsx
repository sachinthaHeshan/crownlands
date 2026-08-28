import PixiGame from "@/components/PixiGame";

export default function Home() {
  return (
    <div className="flex h-dvh w-dvw flex-col bg-zinc-950">
      <main className="relative flex-1 overflow-hidden">
        <PixiGame />
      </main>
    </div>
  );
}
