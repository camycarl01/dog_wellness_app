// src/pages/Dashboard.jsx
import { Link } from "react-router-dom";
import { useDogs } from "../context/DogContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function ageFromDob(dob) {
  if (!dob) return "—";
  const birth = new Date(dob);
  const months =
    (new Date().getFullYear() - birth.getFullYear()) * 12 +
    (new Date().getMonth() - birth.getMonth());
  const y = Math.floor(months / 12);
  const m = months % 12;
  return y > 0 ? `${y}y ${m}m` : `${m}m`;
}

export default function Dashboard() {
  const { activeDog, loading } = useDogs();

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading…</div>;
  }

  if (!activeDog) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="mb-4 text-gray-600">No dogs yet.</p>
        <Link to="/dogs/new">
          <Button>Add your first dog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      {/* Dog header */}
      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          {activeDog.photo_url ? (
            <img
              src={activeDog.photo_url}
              alt={activeDog.name}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-2xl">
              🐕
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{activeDog.name}</h1>
            <p className="text-gray-500">
              {activeDog.breed} · {ageFromDob(activeDog.dob)} · {activeDog.weight_kg} kg
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Health status</CardTitle></CardHeader>
          <CardContent>
            <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-sm text-green-700">
              🟢 No issues logged
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Today's feeding</CardTitle></CardHeader>
          <CardContent className="text-gray-400">Not calculated yet</CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Next vet visit</CardTitle></CardHeader>
          <CardContent className="text-gray-400">Not set yet</CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link to="/health"><Button>Check symptoms</Button></Link>
        <Link to="/nutrition/log"><Button variant="outline">Log meal</Button></Link>
        <Link to="/tracking/weight"><Button variant="outline">Log weight</Button></Link>
      </div>
    </div>
  );
}