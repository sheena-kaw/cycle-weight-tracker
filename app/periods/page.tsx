import { getPeriods } from "@/lib/periods";
import { PeriodForm } from "@/components/periods/PeriodForm";
import { DeletePeriodButton } from "@/components/periods/DeletePeriodButton";

export default function PeriodsPage() {
  const periods = getPeriods();

  return (
    <main className="flex-1 p-8">
      <h1 className="text-xl font-semibold mb-4">Log a period</h1>
      <PeriodForm />

      <h2 className="text-lg font-semibold mb-4 mt-8">Periods</h2>
      {periods.length === 0 ? (
        <p>No periods logged yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th className="text-left pr-4">Start date</th>
              <th className="text-left pr-4">End date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id}>
                <td className="pr-4">{p.start_date}</td>
                <td className="pr-4">{p.end_date ?? "—"}</td>
                <td>
                  <DeletePeriodButton id={p.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
