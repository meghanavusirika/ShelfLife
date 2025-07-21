const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface PantryItem {
  _id?: string;
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  category: string;
  status?: 'fresh' | 'expiring' | 'critical' | 'expired';
  frozen?: boolean;
  originalExpiryDate?: string; // Store original expiry date before freezing
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Recipe {
  _id?: string;
  recipeName: string;
  description: string;
  servingSize: string;
  ingredients: string[];
  instructions: string[];
  time?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  triggeredBy?: string[]; // Array of ingredient names that triggered this recipe
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  imageBase64?: string; // AI-generated image as base64 string
  funFact?: string; // Add this line for compatibility
}

export interface RecipeClick {
  _id?: string;
  recipe: string;
  userId?: string;
  timestamp: Date;
}

class ApiService {
  private getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
  }

  private getAuthHeaders() {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return {
      'Content-Type': 'application/json',
      'x-user-id': user._id,
    };
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
  // Pantry operations
  async getPantryItems(): Promise<PantryItem[]> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/pantry`, {
          headers: this.getAuthHeaders(),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed to fetch pantry items:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError || new Error('Failed to fetch pantry items after multiple attempts');
  }

  async addPantryItem(item: Omit<PantryItem, '_id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<PantryItem> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/pantry`, {
          method: 'POST',
          headers: this.getAuthHeaders(),
          body: JSON.stringify(item),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt} failed to add pantry item:`, error);
        
        if (attempt < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError || new Error('Failed to add pantry item after multiple attempts');
  }

  async updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pantry/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  async deletePantryItem(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/pantry/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }

  // Recipe operations
  async saveRecipes(recipes: Recipe[]): Promise<void> {
    // Save each recipe individually
    for (const recipe of recipes) {
      await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(recipe),
      });
    }
  }

  async getRecipes(): Promise<Recipe[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        headers: this.getAuthHeaders(),
      });
      if (!response.ok) {
        // It's okay to return an empty array if there are no recipes
        // or if the endpoint fails, as recipes are non-critical.
        return [];
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching recipes:', error);
      return [];
    }
  }

  async saveRecipeClick(recipeName: string): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/recipe-clicks`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          recipe: recipeName,
          timestamp: new Date(),
        }),
      });
    } catch (error) {
      console.error('Error saving recipe click:', error);
      // Don't throw error for recipe clicks as it's non-critical
    }
  }

  // Health check
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('API health check failed:', error);
      return false;
    }
  }
}

export const apiService = new ApiService(); 

// AI Recipe Generation
export const generateAIRecipe = async (pantryItems: any[], dietaryPreferences: string[], householdSize: number) => {
  try {
    console.log('🔧 generateAIRecipe called with:', { pantryItems, dietaryPreferences, householdSize });
    
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (!user) {
      console.error('❌ No user found in localStorage');
      throw new Error('User not authenticated');
    }

    console.log('👤 User found:', user._id);

    const requestBody = {
      pantryItems,
      dietaryPreferences,
      householdSize
    };

    console.log('📤 Sending request to AI API:', requestBody);

    const response = await fetch(`${API_BASE_URL}/api/ai-recipes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user._id,
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 Response status:', response.status);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API response not ok:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ AI API response:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in generateAIRecipe:', error);
    throw error;
  }
}; 