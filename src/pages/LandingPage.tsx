import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import ThemePicker from '@/components/ThemePicker';
import Logo from '@/components/ui/logo';
import { ChefHat, Leaf, TrendingUp, ArrowRight, Sparkles, Clock, Users } from 'lucide-react';

const LandingPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className={`min-h-screen ${currentTheme.colors.background} relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 opacity-50"></div>
      
      {/* Navigation */}
      <div className="fixed top-4 right-4 z-40">
        <ThemePicker />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-16">
          <div className="mb-8 animate-fade-in">
            <Logo size="xl" />
          </div>
          <h1 className={`text-5xl md:text-6xl font-bold ${currentTheme.colors.text} mb-6 leading-tight`}>
            Your Smart Kitchen
            <span className="block text-green-600">Companion</span>
          </h1>
          <p className={`text-xl md:text-2xl ${currentTheme.colors.textSecondary} mb-8 max-w-3xl mx-auto leading-relaxed`}>
            Transform your kitchen into a waste-free haven! Track expiry dates, 
            get gentle reminders, and celebrate every meal that saves food from the bin.
          </p>
          <Button
            onClick={handleGetStarted}
            className={`${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center mx-auto`}
            size="lg"
          >
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <Leaf className={`h-10 w-10 ${currentTheme.colors.fresh}`} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Smart Tracking
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Color-coded system shows what's fresh, expiring, or needs attention. 
                Never lose track of your ingredients again.
              </p>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <ChefHat className={`h-10 w-10 ${currentTheme.colors.expiring}`} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                AI Recipe Suggestions
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Get personalized recipe ideas based on your expiring ingredients. 
                Turn potential waste into delicious meals.
              </p>
            </CardContent>
          </Card>

          <Card className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${currentTheme.colors.cardBackground} backdrop-blur-sm`}>
            <CardContent className="p-8 text-center">
              <div className={`w-20 h-20 ${currentTheme.colors.secondary} rounded-full flex items-center justify-center mx-auto mb-6`}>
                <TrendingUp className={`h-10 w-10 ${currentTheme.colors.primary.replace('bg-', 'text-')}`} />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Reduce Waste
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Track your progress and feel good about reducing food waste. 
                Every saved meal counts towards a better planet.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works Section */}
        <div className="mb-16">
          <h2 className={`text-3xl md:text-4xl font-bold text-center ${currentTheme.colors.text} mb-12`}>
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.primary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Add Items</h3>
              <p className="text-gray-600 text-sm">Scan receipts or manually add your pantry items</p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.primary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Track Expiry</h3>
              <p className="text-gray-600 text-sm">Get smart notifications about expiring food</p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.primary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Get Recipes</h3>
              <p className="text-gray-600 text-sm">Receive AI-powered recipe suggestions</p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 ${currentTheme.colors.primary} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <span className="text-white font-bold text-xl">4</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Save Food</h3>
              <p className="text-gray-600 text-sm">Reduce waste and save money</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className={`text-4xl font-bold ${currentTheme.colors.text} mb-2`}>10K+</div>
              <div className="text-sm text-gray-500">Meals Saved</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${currentTheme.colors.text} mb-2`}>5K+</div>
              <div className="text-sm text-gray-500">Happy Users</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${currentTheme.colors.text} mb-2`}>50%</div>
              <div className="text-sm text-gray-500">Less Waste</div>
            </div>
            <div className="text-center">
              <div className={`text-4xl font-bold ${currentTheme.colors.text} mb-2`}>24/7</div>
              <div className="text-sm text-gray-500">Smart Monitoring</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className={`max-w-2xl mx-auto ${currentTheme.colors.cardBackground} shadow-2xl border-none`}>
            <CardContent className="p-8">
              <Sparkles className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className={`text-2xl font-bold ${currentTheme.colors.text} mb-4`}>
                Ready to Transform Your Kitchen?
              </h2>
              <p className={`text-lg ${currentTheme.colors.textSecondary} mb-6`}>
                Join thousands of users who are already saving food and money with ShelfLife.
              </p>
              <Button
                onClick={handleGetStarted}
                className={`${currentTheme.colors.primary} ${currentTheme.colors.primaryHover} text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                size="lg"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 