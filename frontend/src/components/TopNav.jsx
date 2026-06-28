// src/components/TopNav.jsx
import { Link, useLocation } from "react-router-dom";
import { useDogs } from "../context/DogContext";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/health", label: "Health" },
  { to: "/nutrition", label: "Nutrition" },
  { to: "/vet", label: "Vet" },
  { to: "/tracking/weight", label: "Weight" },
];

export default function TopNav() {
  const { pathname } = useLocation();
  const { dogs, activeDogId, setActiveDogId } = useDogs();

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-teal-700">🐾 Dog Wellness</span>
          <nav className="hidden gap-4 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`text-sm ${
                  pathname === l.to
                    ? "font-semibold text-teal-700"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {dogs.length > 0 && (
            <Select value={activeDogId ?? ""} onValueChange={setActiveDogId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select dog" />
              </SelectTrigger>
              <SelectContent>
                {dogs.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Link to="/dogs/new">
            <Button size="sm" variant="outline">+ Add dog</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}