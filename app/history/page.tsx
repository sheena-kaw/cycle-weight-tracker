import { getWeights } from "@/lib/weights";
import { DeleteWeightButton } from "@/components/DeleteWeightButton";

export default function HistoryPage() {
  const weights = getWeights();

  return (
    <main className="flex-1 p-8">
      <h1 className="text-xl font-semibold mb-4">Weight history</h1>
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
