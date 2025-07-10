import RankingsGrid from "@/app/components/RankingsGrid";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NFL Rankings | The Snap',
  description: 'Comprehensive NFL rankings covering offense, defense, fantasy football, and more. Expert analysis and data-driven insights.',
  openGraph: {
    title: 'NFL Rankings | The Snap',
    description: 'Comprehensive NFL rankings covering offense, defense, fantasy football, and more.',
    type: 'website',
  },
};

export const revalidate = 60;

export default async function RankingsPage() {
  return <RankingsGrid showSidebar={true} />;
}
