import { GraduationCap, Bell, User } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-orange to-secondary-orange rounded-lg flex items-center justify-center">
                <GraduationCap className="text-white text-lg" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-dark-gray">EstudaFácil</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-medium-gray hover:text-dark-gray transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 bg-primary-orange rounded-full flex items-center justify-center">
              <User className="text-white w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
