
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Leaf, TrendingUp } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemePicker from "./ThemePicker";
import Logo from "@/components/ui/logo";

interface WelcomeHeroProps {
  onGetStarted: () => void;
}

const WelcomeHero = ({ onGetStarted }: WelcomeHeroProps) => {
  const { currentTheme } = useTheme();

  return (
    <div className={`min-h-screen ${currentTheme.colors.background} flex flex-col items-center justify-center p-4 relative`}>
      <div className="fixed top-4 right-4 z-40">
        <ThemePicker />
      </div>
      
      <div className="max-w-6xl mx-auto text-center">
        <div className="mb-8 animate-fade-in">
          <div className="mb-6">
            <Logo size="xl" />
          </div>
          <p className="text-2xl text-gray-700 mb-2">
            Your friendly kitchen companion
          </p>
          <p className={`text-lg ${currentTheme.colors.textSecondary} max-w-2xl mx-auto`}>
            Transform your kitchen into a waste-free haven! Track expiry dates, 
            get gentle reminders, and celebrate every meal that saves food from the bin.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Leaf className={`h-8 w-8 ${currentTheme.colors.fresh}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Smart Tracking
              </h3>
              <p className="text-gray-600">
                Color-coded system shows what's fresh, expiring, or needs attention
              </p>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <ChefHat className={`h-8 w-8 ${currentTheme.colors.expiring}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Gentle Reminders
              </h3>
              <p className="text-gray-600">
                Friendly notifications help you use ingredients before they expire
              </p>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <TrendingUp className={`h-8 w-8 ${currentTheme.colors.primary.replace('bg-', 'text-')}`} />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Celebrate Wins
              </h3>
              <p className="text-gray-600">
                Track your food-saving progress and feel good about reducing waste
              </p>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={onGetStarted}
          className={`${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
          size="lg"
        >
          Start Your Kitchen Journey ✨
        </Button>

        {/* Community Stats */}
        <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme.colors.text}`}>10K+</div>
            <div className="text-sm text-gray-500">Meals Saved</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme.colors.text}`}>5K+</div>
            <div className="text-sm text-gray-500">Happy Users</div>
          </div>
          <div className="text-center">
            <div className={`text-3xl font-bold ${currentTheme.colors.text}`}>50%</div>
            <div className="text-sm text-gray-500">Less Waste</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeHero;
