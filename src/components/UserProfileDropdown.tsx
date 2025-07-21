import React, { useState } from 'react';
import { Button } from './ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from './ui/popover';
import { 
  User, 
  Settings, 
  LogOut, 
  Palette,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemePicker from './ThemePicker';

interface UserProfileDropdownProps {
  userProfile: {
    _id: string;
    email: string;
    name: string;
    full_name?: string;
    createdAt: Date;
    dietaryPreferences?: string[];
    cookingStyle?: string;
    cookingGoals?: string[];
    onboardingCompleted?: boolean;
    householdSize?: number;
  } | null;
  onUpdatePreferences: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ 
  userProfile, 
  onUpdatePreferences 
}) => {
  const { logout } = useAuth();
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getUserInitial = () => {
    if (userProfile?.full_name) {
      return userProfile.full_name.charAt(0).toUpperCase();
    }
    if (userProfile?.name) {
      return userProfile.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    return userProfile?.full_name || userProfile?.name || 'User';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${currentTheme.colors.text}`}
        >
          {/* Avatar Circle */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br from-green-500 to-green-600 shadow-sm`}>
            {getUserInitial()}
          </div>
          
          {/* User Name */}
          <span className="hidden sm:block font-medium">
            {getUserDisplayName()}
          </span>
          
          {/* Dropdown Arrow */}
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        className={`w-56 ${currentTheme.colors.cardBackground} border ${currentTheme.colors.border} shadow-lg p-0`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-br from-green-500 to-green-600`}>
              {getUserInitial()}
            </div>
            <div>
              <div className="font-semibold">{getUserDisplayName()}</div>
              <div className={`text-xs ${currentTheme.colors.textSecondary}`}>
                {userProfile?.email}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-2">
          <Button
            variant="ghost"
            onClick={onUpdatePreferences}
            className={`w-full justify-start ${currentTheme.colors.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
          >
            <User className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setShowSettings(!showSettings)}
            className={`w-full justify-start ${currentTheme.colors.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
            <ChevronDown className={`h-4 w-4 ml-auto transition-transform ${showSettings ? 'rotate-180' : ''}`} />
          </Button>
          
          {showSettings && (
            <div className="px-2 py-1 bg-gray-50 dark:bg-gray-800/50 rounded mx-2">
              <div className="text-xs text-gray-500 mb-2 px-2 font-medium">General</div>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-sm ${currentTheme.colors.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                Notifications
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-sm ${currentTheme.colors.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                Privacy & Security
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-sm ${currentTheme.colors.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                Data & Storage
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`w-full justify-start text-sm ${currentTheme.colors.text} hover:bg-gray-100 dark:hover:bg-gray-800`}
              >
                <span className="w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                Help & Support
              </Button>
              
              <div className="border-t border-gray-200 my-2" />
              
                             <div className="text-xs text-gray-500 mb-2 px-2 font-medium">Appearance</div>
               <div className="flex items-center justify-center p-2">
                 <ThemePicker />
               </div>
            </div>
          )}
          
          <div className="border-t border-gray-200 my-2" />
          
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default UserProfileDropdown; 