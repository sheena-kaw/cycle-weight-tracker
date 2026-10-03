import { WeightForm } from "@/components/WeightForm";

export default function Home() {
  return (
    <main className="flex-1 p-8">
      <h1 className="text-xl font-semibold mb-4">Log today&apos;s weight</h1>
      <WeightForm />
    </main>
  );
}
