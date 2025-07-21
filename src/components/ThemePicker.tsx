
import { useState } from 'react';
import { Palette, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/contexts/ThemeContext';

const ThemePicker = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <>
      {/* Theme Picker Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="ghost"
        size="sm"
        className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
      >
        <Palette className="h-4 w-4 mr-2" />
        Appearance
      </Button>

      {/* Theme Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Card className="w-[700px] bg-white border border-gray-200 shadow-2xl rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Choose Your Kitchen Style ✨
                </h3>
                <Button
                  onClick={() => setIsOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="hover:bg-gray-100 rounded-full p-2"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`group relative aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                      currentTheme.id === theme.id
                        ? 'border-green-500 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selection indicator */}
                    {currentTheme.id === theme.id && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Theme Color Box */}
                    <div className={`w-full h-full rounded-xl ${theme.colors.background} flex items-center justify-center p-4`}>
                      <div className="text-center">
                        <div className="text-4xl mb-3">{theme.emoji}</div>
                        <div className="text-lg font-semibold text-gray-800 leading-tight">{theme.name}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-sm text-gray-500 text-center mt-4">
                Your theme preference is saved automatically
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default ThemePicker;
