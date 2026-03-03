import { NewsFeed } from "@/components/news-feed";

export default function Home() {
  return (
    <div className="flex h-dvh items-center justify-center bg-black md:p-8">
      <div className="relative h-full w-full overflow-hidden bg-bg-dark md:h-[844px] md:max-h-[calc(100dvh-4rem)] md:max-w-[390px] md:rounded-[40px] md:border md:border-white/10 md:shadow-2xl">
        <NewsFeed />
      </div>
    </div>
  );
}
