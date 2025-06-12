import { Home, Calendar, FileText, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function BottomNavigation() {
  const [location] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/schedule", icon: Calendar, label: "Cronograma" },
    { path: "/pdf-reader", icon: FileText, label: "PDFs" },
    { path: "/progress", icon: TrendingUp, label: "Progresso" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden">
      <div className="grid grid-cols-4 py-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link key={path} href={path}>
            <button
              className={`flex flex-col items-center py-2 px-3 transition-colors ${
                location === path
                  ? "text-primary-orange"
                  : "text-medium-gray hover:text-dark-gray"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
