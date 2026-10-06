import type { Metadata } from "next";
import SavedStories from "../components/SavedStories";
import MyTeam from "./MyTeam";
export const metadata: Metadata = {
  title: "My Snap | The Game Snap",
  robots: { index: false, follow: false },
};
export default function MySnap() {
  return (
    <main className="min-h-[75vh] bg-white px-5 py-10 text-neutral-900">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-sky-700">
          Your football, your way
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">My Snap</h1>
        <p className="mt-3 text-neutral-600">
          Your team and the stories you want to come back to.
        </p>
        <MyTeam />
        <SavedStories />
      </div>
    </main>
  );
}
