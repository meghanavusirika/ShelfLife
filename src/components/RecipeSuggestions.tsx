import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ChefHat, Users, AlertTriangle, RefreshCw } from 'lucide-react';
import { PantryItem, UserProfile } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import { apiService, generateAIRecipe } from '@/services/api';

interface GeneratedRecipe {
  recipeName: string;
  description: string;
  servingSize: string;
  ingredients: string[];
  instructions: string[];
  time?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  funFact?: string;
  imageBase64?: string;
}

interface RecipeSuggestionsProps {
  items: PantryItem[];
  forceGenerate?: boolean;
  userProfile?: UserProfile | null;
}

const RecipeSuggestions: React.FC<RecipeSuggestionsProps> = ({ items, forceGenerate = false, userProfile }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastTriggeredItems, setLastTriggeredItems] = useState<string[]>([]);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<Date | null>(null);
  const [previousItemNames, setPreviousItemNames] = useState<string[]>([]);
  
  // Use ref to track current triggered items to avoid circular dependency
  const lastTriggeredItemsRef = useRef<string[]>([]);
  const isGeneratingRef = useRef(false);

  // Helper function to calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Build personalized prompt based on user preferences
  const buildPersonalizedPrompt = (availableIngredients: string, isRefresh = false) => {
    let prompt = '';
    
    // Add variety to refresh requests
    const varietyPhrases = [
      'Create 3 unique and different recipes',
      'Generate 3 fresh and creative recipes',
      'Suggest 3 new and exciting recipes',
      'Come up with 3 innovative recipes',
      'Design 3 diverse recipes'
    ];
    
    const varietyPhrase = isRefresh ? varietyPhrases[Math.floor(Math.random() * varietyPhrases.length)] : 'Create 3 recipes';
    
    // Base request
    if (availableIngredients) {
      prompt = `${varietyPhrase} using these expiring ingredients: ${availableIngredients}. Include common pantry items.`;
    } else {
      prompt = `${varietyPhrase} using common pantry ingredients.`;
    }

    // Add user preferences if available
    if (userProfile) {
      const preferences = [];
      
      // Dietary restrictions
      if (userProfile.dietaryPreferences && userProfile.dietaryPreferences.length > 0) {
        const dietaryReqs = userProfile.dietaryPreferences
          .filter(pref => pref !== 'No restrictions')
          .join(', ');
        if (dietaryReqs) {
          preferences.push(`dietary requirements: ${dietaryReqs}`);
        }
      }
      
      // Cooking style
      if (userProfile.cookingStyle) {
        preferences.push(`cooking style: ${userProfile.cookingStyle}`);
      }
      
      // Household size for serving portions
      if (userProfile.householdSize && userProfile.householdSize > 1) {
        preferences.push(`serves ${userProfile.householdSize} people`);
      }
      
      // Cooking goals
      if (userProfile.cookingGoals && userProfile.cookingGoals.length > 0) {
        const goals = userProfile.cookingGoals.join(', ');
        preferences.push(`focus on: ${goals}`);
      }
      
      // Add preferences to prompt
      if (preferences.length > 0) {
        prompt += ` Requirements: ${preferences.join(', ')}.`;
      }
    }
    
    // Add JSON format requirement
    prompt += ` Return JSON with recipeName, description, servingSize, ingredients[], instructions[].`;
    
    return prompt;
  };

  // Load existing recipes and state on component mount
  useEffect(() => {
    loadExistingRecipes();
    loadPersistedState();
  }, []);

  // Handle force generation when Recipe Ideas button is clicked
  useEffect(() => {
    if (forceGenerate && items.length > 0 && !loading) {
      console.log('Force generating recipes due to Recipe Ideas button click');
      isGeneratingRef.current = false; // Reset flag to allow generation
      generateRecipes();
    }
  }, [forceGenerate, items.length, loading]);

  const loadPersistedState = () => {
    try {
      const persistedTriggers = localStorage.getItem('shelflife-last-triggered-items');
      if (persistedTriggers) {
        setLastTriggeredItems(JSON.parse(persistedTriggers));
      }
    } catch (error) {
      console.error('Error loading persisted state:', error);
    }
  };

  const savePersistedState = (triggeredItems: string[]) => {
    try {
      localStorage.setItem('shelflife-last-triggered-items', JSON.stringify(triggeredItems));
    } catch (error) {
      console.error('Error saving persisted state:', error);
    }
  };

  // Update ref when state changes
  useEffect(() => {
    lastTriggeredItemsRef.current = lastTriggeredItems;
  }, [lastTriggeredItems]);

  // Auto-trigger recipe generation when conditions are met
  useEffect(() => {
    if (items.length === 0 || isGeneratingRef.current) return;

    // Count items by urgency status
    const criticalItems = items.filter(item => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days <= 1; // Critical: expires today or tomorrow
    });

    const expiringItems = items.filter(item => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days >= 2 && days <= 3; // Expiring: expires in 2-3 days
    });

    const urgentItems = [...criticalItems, ...expiringItems];
    const currentUrgentItemNames = urgentItems.map(item => item.name).sort();
    const currentAllItemNames = items.map(item => item.name).sort();

    // Check if we have new urgent items that weren't there before
    const hasNewUrgentItems = currentUrgentItemNames.some(name => !lastTriggeredItems.includes(name));
    
    // Check if any previously urgent items were removed (marked as used)
    const removedUrgentItems = lastTriggeredItems.filter(name => !currentAllItemNames.includes(name));
    const hasRemovedUrgentItems = removedUrgentItems.length > 0;
    
    // Only auto-generate if:
    // 1. We have urgent items AND (new urgent items OR removed urgent items)
    // 2. We're not currently loading
    // 3. We're not currently generating
    const shouldAutoGenerate = urgentItems.length > 0 && (hasNewUrgentItems || hasRemovedUrgentItems) && !isGeneratingRef.current;

    // Debug logging
    console.log('Recipe trigger check:', {
      urgentItemsCount: urgentItems.length,
      currentUrgentItems: currentUrgentItemNames,
      lastTriggeredItems,
      hasNewUrgentItems,
      removedUrgentItems,
      hasRemovedUrgentItems,
      shouldAutoGenerate,
      loading,
      recipesCount: recipes.length,
      isGenerating: isGeneratingRef.current
    });

    if (shouldAutoGenerate && !loading) {
      if (hasRemovedUrgentItems) {
        console.log(`Regenerating recipes due to removed items: ${removedUrgentItems.join(', ')}`);
      }
      if (hasNewUrgentItems) {
        console.log('New urgent items detected:', currentUrgentItemNames.filter(name => !lastTriggeredItems.includes(name)));
      }
      console.log(`Auto-generating recipes: ${criticalItems.length} critical items, ${expiringItems.length} expiring items`);
      
      // Set flag to prevent double execution
      isGeneratingRef.current = true;
      
      const newTriggeredItems = currentUrgentItemNames;
      // Only update if items are actually different to prevent circular dependency
      const itemsAreDifferent = JSON.stringify(newTriggeredItems.sort()) !== JSON.stringify(lastTriggeredItems.sort());
      if (itemsAreDifferent) {
        setLastTriggeredItems(newTriggeredItems);
        savePersistedState(newTriggeredItems);
      }
      generateRecipes();
    }

    // Update previous item names for next comparison
    setPreviousItemNames(currentAllItemNames);
  }, [items, loading, lastTriggeredItems]); // Added lastTriggeredItems back but with better logic

  const loadExistingRecipes = async () => {
    try {
      const existingRecipes = await apiService.getRecipes();
      if (existingRecipes.length > 0) {
        // Get the most recent recipes (last 3)
        const recentRecipes = existingRecipes.slice(0, 3).map(recipe => ({
          recipeName: recipe.recipeName,
          description: recipe.description,
          servingSize: recipe.servingSize,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          time: recipe.time || '20-30 min',
          difficulty: recipe.difficulty || 'Easy' as const,
          funFact: recipe.funFact
        }));
        setRecipes(recentRecipes.map(recipe => ({
          recipeName: recipe.recipeName,
          description: recipe.description,
          servingSize: recipe.servingSize,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          time: recipe.time || '20-30 min',
          difficulty: recipe.difficulty || 'Easy' as const,
          funFact: recipe.funFact
        })));
        
        // Set the last triggered items based on the most recent recipe
        if (existingRecipes[0].triggeredBy) {
          const triggeredItems = existingRecipes[0].triggeredBy;
          setLastTriggeredItems(triggeredItems);
          savePersistedState(triggeredItems);
        }
        
        // Set the last generated time from the most recent recipe
        if (existingRecipes[0].createdAt) {
          setLastGeneratedTime(new Date(existingRecipes[0].createdAt));
        }
      }
    } catch (error) {
      console.error('Error loading existing recipes:', error);
    }
  };

  const generateRecipes = async (isRefresh = false) => {
    setError('');
    setLoading(true);

    // Debug: Check if user is authenticated
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    console.log('🔍 User authentication check:', { user, userStr: userStr ? 'exists' : 'null' });
    
    if (!user) {
      console.error('❌ No user found in localStorage - AI generation will fail');
      // For testing, create a dummy user
      const dummyUser = {
        _id: 'f3cf51285e15fd40d32dfdab',
        email: 'test@example.com',
        name: 'Test User'
      };
      localStorage.setItem('currentUser', JSON.stringify(dummyUser));
      console.log('🔄 Created dummy user for testing:', dummyUser);
    }

    // Extract names from urgent items
    const urgentItems = items.filter(item => {
      const days = getDaysUntilExpiry(item.expiryDate);
      return days <= 1 || (days >= 2 && days <= 3); // Critical or expiring
    });
    const availableIngredients = urgentItems.map(item => item.name).join(', ');

    // Debug: Check if there are urgent items
    console.log('📦 Urgent items found:', urgentItems);
    console.log('📦 All items:', items);
    
    if (urgentItems.length === 0) {
      console.log('⚠️ No urgent items found - using all items for recipe generation');
      // If no urgent items, use all items
      const allItems = items.slice(0, 3); // Use first 3 items
      urgentItems.push(...allItems);
    }

    // Clear existing recipes only when generating new ones
    setRecipes([]);

    console.log('🤖 Starting AI recipe generation...');
    console.log('Available ingredients:', availableIngredients);
    console.log('User preferences:', userProfile);
    console.log('Urgent items count:', urgentItems.length);

    try {
      // Generate 3 AI recipes at once
      const aiRecipes: GeneratedRecipe[] = [];
      
      console.log('🚀 Calling AI recipe generation API...');
      
      // Generate 3 recipes in parallel for better performance
      const recipePromises = Array.from({ length: 3 }, (_, index) => {
        console.log(`📞 Making AI call ${index + 1}/3...`);
        return generateAIRecipe(
          urgentItems,
          userProfile?.dietaryPreferences || [],
          userProfile?.householdSize || 2
        );
      });

      const results = await Promise.allSettled(recipePromises);
      
      console.log('📊 AI generation results:', results);
      
      // Process successful results
      results.forEach((result, index) => {
        console.log(`🔍 Processing result ${index + 1}:`, result);
        if (result.status === 'fulfilled' && result.value.success && result.value.recipe) {
          console.log(`✅ AI recipe ${index + 1} generated successfully:`, result.value.recipe.recipeName);
          const aiRecipe: GeneratedRecipe = {
            recipeName: result.value.recipe.recipeName,
            description: result.value.recipe.description,
            servingSize: result.value.recipe.servingSize,
            ingredients: result.value.recipe.ingredients,
            instructions: result.value.recipe.instructions,
            time: result.value.recipe.cookTime,
            difficulty: result.value.recipe.difficulty as 'Easy' | 'Medium' | 'Hard',
            funFact: result.value.recipe.funFact
          };
          aiRecipes.push(aiRecipe);
        } else {
          console.log(`❌ AI recipe ${index + 1} failed:`, result);
        }
      });

      console.log(`🎯 Generated ${aiRecipes.length} AI recipes`);

      // If we don't have enough AI recipes, fill with fallback recipes
      const fallbackRecipes = getFallbackRecipes(availableIngredients, isRefresh);
      while (aiRecipes.length < 3) {
        const fallbackRecipe = fallbackRecipes[aiRecipes.length];
        if (fallbackRecipe) {
          console.log(`🔄 Adding fallback recipe: ${fallbackRecipe.recipeName}`);
          aiRecipes.push(fallbackRecipe);
        }
      }

      // Set recipes first so UI shows them immediately
      const finalRecipes = aiRecipes.slice(0, 3);
      console.log('📝 Final recipes to display:', finalRecipes.map(r => r.recipeName));
      setRecipes(finalRecipes);
      setLastGeneratedTime(new Date());

      // Save recipes to database
      const recipesToSave = finalRecipes.map(recipe => ({
        ...recipe,
        triggeredBy: urgentItems.map(item => item.name)
      }));
      await apiService.saveRecipes(recipesToSave);
      
      // Check if this was triggered by removed items
      const removedItems = lastTriggeredItems.filter(name => 
        !items.map(item => item.name).includes(name)
      );
      
      const isRegeneratedDueToRemovedItems = removedItems.length > 0;
      
      toast({
        title: isRegeneratedDueToRemovedItems ? "AI Recipes Updated! 🤖🔄" : "AI Recipes Generated! 🤖🍳",
        description: isRegeneratedDueToRemovedItems 
          ? `Updated AI recipes after using ${removedItems.join(', ')}. Found ${finalRecipes.length} new suggestions!`
          : `Created ${finalRecipes.length} AI-powered recipes using your expiring ingredients.`
      });

    } catch (err) {
      console.error('❌ Error generating AI recipes:', err);
      
      // Use fallback recipes if AI fails
      const fallbackRecipes = getFallbackRecipes(availableIngredients, isRefresh);
      setRecipes(fallbackRecipes);
      setLastGeneratedTime(new Date());
      
      toast({
        title: "Using Backup Recipes",
        description: "AI unavailable, showing curated recipes instead.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      // Reset generation flag to allow future generations
      isGeneratingRef.current = false;
    }
  };

  const getFallbackRecipes = (availableIngredients: string, isRefresh = false): GeneratedRecipe[] => {
    const defaultServingSize = userProfile?.householdSize ? `Serves ${userProfile.householdSize}` : 'Serves 2-3';
    
    // Extended fallback recipes for more variety
    const allFallbackRecipes: GeneratedRecipe[] = [
      {
        recipeName: 'Quick Stir Fry',
        description: 'A fast and healthy way to use up vegetables and proteins.',
        servingSize: defaultServingSize,
        ingredients: ['Available vegetables', '2 tbsp oil', '2 cloves garlic', 'Soy sauce', 'Rice or noodles'],
        instructions: ['Heat oil in pan', 'Add garlic and vegetables', 'Stir-fry for 5-7 minutes', 'Add soy sauce', 'Serve over rice'],
        time: '15 min',
        difficulty: 'Easy' as const
      },
      {
        recipeName: 'Simple Soup',
        description: 'Comforting soup using whatever vegetables you have on hand.',
        servingSize: defaultServingSize,
        ingredients: ['Available vegetables', '4 cups broth', '1 onion', 'Salt and pepper', 'Herbs'],
        instructions: ['Sauté onion', 'Add vegetables and broth', 'Simmer 20 minutes', 'Season to taste', 'Serve hot'],
        time: '25 min',
        difficulty: 'Easy' as const
      },
      {
        recipeName: 'Pantry Pasta',
        description: 'Use up ingredients in a satisfying pasta dish.',
        servingSize: defaultServingSize,
        ingredients: ['8 oz pasta', 'Available proteins/vegetables', '2 tbsp olive oil', 'Garlic', 'Parmesan cheese'],
        instructions: ['Cook pasta', 'Sauté garlic and ingredients', 'Combine with pasta', 'Add cheese', 'Serve immediately'],
        time: '20 min',
        difficulty: 'Easy' as const
      },
      {
        recipeName: 'Quick Quesadilla',
        description: 'Fast and cheesy way to use up ingredients.',
        servingSize: defaultServingSize,
        ingredients: ['Tortillas', 'Cheese', 'Available vegetables/proteins', 'Salsa', 'Sour cream'],
        instructions: ['Layer ingredients on tortilla', 'Top with second tortilla', 'Cook in pan until golden', 'Cut and serve'],
        time: '10 min',
        difficulty: 'Easy' as const
      },
      {
        recipeName: 'Simple Salad Bowl',
        description: 'Fresh and healthy bowl using available ingredients.',
        servingSize: defaultServingSize,
        ingredients: ['Mixed greens', 'Available vegetables', 'Protein of choice', 'Olive oil', 'Vinegar'],
        instructions: ['Arrange greens in bowl', 'Add chopped vegetables', 'Top with protein', 'Drizzle with dressing'],
        time: '10 min',
        difficulty: 'Easy' as const
      },
      {
        recipeName: 'Quick Frittata',
        description: 'Easy egg dish perfect for using up ingredients.',
        servingSize: defaultServingSize,
        ingredients: ['6 eggs', 'Available vegetables', 'Cheese', 'Salt and pepper', 'Butter'],
        instructions: ['Whisk eggs', 'Sauté vegetables', 'Add eggs to pan', 'Cook until set', 'Serve hot'],
        time: '15 min',
        difficulty: 'Easy' as const
      }
    ];
    
    // Get the recipes to return (either shuffled for refresh or first 3)
    const recipesToReturn = isRefresh ? 
      [...allFallbackRecipes].sort(() => 0.5 - Math.random()).slice(0, 3) : 
      allFallbackRecipes.slice(0, 3);
    
    // Modify recipes based on dietary preferences
    if (userProfile?.dietaryPreferences?.includes('Vegetarian') || userProfile?.dietaryPreferences?.includes('Vegan')) {
      recipesToReturn[0].ingredients = recipesToReturn[0].ingredients.filter(ing => !ing.includes('proteins'));
      recipesToReturn[2].ingredients = recipesToReturn[2].ingredients.map(ing => 
        ing.includes('Parmesan cheese') ? 'Nutritional yeast or herbs' : ing
      );
    }

    if (userProfile?.dietaryPreferences?.includes('Gluten-free')) {
      recipesToReturn[2].ingredients = recipesToReturn[2].ingredients.map(ing => 
        ing.includes('pasta') ? 'Gluten-free pasta' : ing
      );
    }

    return recipesToReturn;
  };

  const convertToUrlSlug = (recipeName: string): string => {
    return recipeName.toLowerCase().replace(/\s+/g, '-');
  };

  const handleRecipeClick = (recipe: GeneratedRecipe) => {
    // Save recipe click to MongoDB
    apiService.saveRecipeClick(recipe.recipeName);
    
    // Navigate to the recipe details page
    const urlSlug = convertToUrlSlug(recipe.recipeName);
    navigate(`/recipe/${urlSlug}`, { state: { recipe } });
  };

  const handleManualRefresh = () => {
    // Clear existing recipes immediately for better UX
    setRecipes([]);
    setError('');
    
    // Reset the last triggered items to force regeneration
    setLastTriggeredItems([]);
    savePersistedState([]);
    
    // Reset generation flag to allow manual refresh
    isGeneratingRef.current = false;
    
    // Force new recipe generation with refresh flag
    generateRecipes(true);
    
    // Show feedback to user
    toast({
      title: "🔄 Generating New Recipes",
      description: "AI is cooking up fresh recipe ideas for you!",
      duration: 2000
    });
  };

  const formatLastGeneratedTime = (time: Date | null) => {
    if (!time) return '';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-200 text-green-900 border-green-400';
      case 'Medium': return 'bg-amber-200 text-amber-900 border-amber-400';
      case 'Hard': return 'bg-red-200 text-red-900 border-red-400';
      default: return 'bg-gray-200 text-gray-900 border-gray-400';
    }
  };

  const criticalItems = items.filter(item => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days <= 1;
  });

  const expiringItems = items.filter(item => {
    const days = getDaysUntilExpiry(item.expiryDate);
    return days >= 2 && days <= 3;
  });

  const shouldShowAlert = criticalItems.length >= 1;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          🤖 AI Recipe Suggestions
        </h2>
        {recipes.length > 0 && (
          <div className="flex items-center gap-4">
            {lastGeneratedTime && (
              <span className="text-sm text-gray-500">
                Generated {formatLastGeneratedTime(lastGeneratedTime)}
              </span>
            )}
            <Button
              onClick={handleManualRefresh}
              disabled={loading}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Auto-generation alert */}
      {shouldShowAlert && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">⚡ Urgent Recipe Alert!</h3>
          </div>
          <p className="text-red-700 text-sm">
            You have <strong>{criticalItems.length} item{criticalItems.length > 1 ? 's' : ''}</strong> expiring very soon
            {expiringItems.length > 0 ? ` and ${expiringItems.length} item${expiringItems.length > 1 ? 's' : ''} expiring in 2-3 days` : ''}. 
            AI recipes have been generated to help you use these urgent ingredients!
          </p>
        </div>
      )}



      {/* Enhanced Loading indicator */}
      {loading && (
        <div className="flex flex-col justify-center items-center py-12">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold text-blue-700 mb-2">🤖 AI is Cooking Up Ideas...</p>
            <p className="text-sm text-gray-600">Analyzing your pantry • Considering dietary preferences • Creating personalized recipes</p>
          </div>
          <div className="mt-4 flex space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Display recipes */}
      {recipes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe, index) => (
            <Card 
              key={index}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105 border-2 hover:border-blue-300"
              onClick={() => handleRecipeClick(recipe)}
            >
              {/* No image or placeholder */}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  {recipe.recipeName}
                </CardTitle>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {recipe.time || '20-30 min'}
                  </div>
                  <Badge className={`text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}>
                    {recipe.difficulty || 'Easy'}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="w-4 h-4 mr-1" />
                  {recipe.servingSize}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {recipe.description}
                </p>
                <p className="text-sm text-gray-500 mb-2">
                  <span className="font-medium">Key ingredients:</span> {recipe.ingredients.slice(0, 3).join(', ')}
                  {recipe.ingredients.length > 3 && '...'}
                </p>
                {('funFact' in recipe) && recipe.funFact && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <span className="font-medium">💡 Fun Fact:</span> {recipe.funFact}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-blue-600 font-medium">
                    🤖 AI Generated
                  </p>
                  <p className="text-xs text-gray-500">
                    Click for details →
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !loading && items.length === 0 ? (
        <div className="text-center py-8">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Add some ingredients to your pantry to get AI-powered recipe suggestions!</p>
        </div>
      ) : !loading && (
        <div className="text-center py-8">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Recipes will automatically appear when ingredients are expiring soon!</p>
        </div>
      )}
    </div>
  );
};

export default RecipeSuggestions; 