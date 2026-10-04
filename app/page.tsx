import { format } from "date-fns";
import { getPeriods } from "@/lib/periods";
import { getPhaseRanges, getPhaseForDate } from "@/lib/phases";
import { getWeights } from "@/lib/weights";
import { WeightForm } from "@/components/weights/WeightForm";
import { Chart } from "@/components/Chart";

export default function Home() {
  const periods = getPeriods();
  const ranges = getPhaseRanges(periods);
  const weights = getWeights();
  const today = format(new Date(), "yyyy-MM-dd");
  const todayStatus = getPhaseForDate(today, ranges);

  return (
    <main className="flex-1 p-8">
      <h1 className="text-xl font-semibold mb-4">Today&apos;s status</h1>
      {periods.length < 2 ? (
        <p className="mb-2">
          Log at least 2 periods to see your estimated cycle phase.
        </p>
      ) : todayStatus ? (
        <p className="mb-2">
          You&apos;re likely in your <strong>{todayStatus.phase}</strong> phase
          today{todayStatus.estimated ? " (estimated)" : ""}.
        </p>
      ) : (
        <p className="mb-2">
          Not enough data to estimate today&apos;s phase yet — log a period to
          update your status.
        </p>
      )}
      <p className="text-sm text-gray-500 mb-8">
        Phases are estimates based on logged periods, not medical advice.
      </p>

      <h2 className="text-lg font-semibold mb-4">Weight over time</h2>
      <Chart weights={weights} ranges={ranges} />

      <h2 className="text-lg font-semibold mb-4 mt-8">
        Log today&apos;s weight
      </h2>
      <WeightForm />
    </main>
  );
}
