import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getWeights } from "@/lib/weights";
import { WeightForm } from "@/components/weights/WeightForm";
import { DeleteWeightButton } from "@/components/weights/DeleteWeightButton";

export default async function HistoryPage() {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user) redirect("/auth/sign-in");

  const weights = await getWeights(user.id);

  return (
    <main className="flex-1 p-8">
      <h1 className="text-xl font-semibold mb-4">Log a weight</h1>
      <WeightForm />

      <h2 className="text-lg font-semibold mb-4 mt-8">Weight history</h2>
      {weights.length === 0 ? (
        <p>No weights logged yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="text-left pr-4">Date</th>
              <th className="text-left pr-4">Weight</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {weights.map((w) => (
              <tr key={w.id}>
                <td className="pr-4">{w.date}</td>
                <td className="pr-4">{w.weight} lb</td>
                <td>
                  <DeleteWeightButton id={w.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
