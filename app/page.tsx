import { getWeights } from "@/lib/weights";

export default function Home() {
  const weights = getWeights();

  return (
    <main className="flex-1 p-8">
      <h1 className="text-xl font-semibold mb-4">Weights</h1>
      {weights.length === 0 ? (
        <p>No weights logged yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="text-left pr-4">Date</th>
              <th className="text-left">Weight</th>
            </tr>
          </thead>
          <tbody>
            {weights.map((w) => (
              <tr key={w.id}>
                <td className="pr-4">{w.date}</td>
                <td>{w.weight} lb</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
