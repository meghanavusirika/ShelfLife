import express from 'express';
import cors from 'cors';
import pkg from 'mongodb';
const { MongoClient, ServerApi, ObjectId } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import LocalStorageDB, { ObjectId as LocalObjectId } from './localStorage.js';

// Load .env file - check both current directory and parent directory
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load .env from parent directory (project root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB connection
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('Please create a .env file with your MongoDB connection string');
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
});

let db;
let usingLocalStorage = false;
let ObjectIdClass = ObjectId;

// Connect to MongoDB with fallback to local storage
async function connectToMongo() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Successfully connected to MongoDB!");
    db = client.db("shelflife");
    usingLocalStorage = false;
  } catch (error) {
    console.error("⚠️ MongoDB connection failed:", error.message);
    console.log("📦 Falling back to local storage...");
    
    // Use local storage as fallback
    const localDB = new LocalStorageDB();
    await localDB.init();
    db = localDB;
    usingLocalStorage = true;
    ObjectIdClass = LocalObjectId;
    
    console.log("✅ Using local storage backend");
    console.log("🔍 Testing local storage...");
    
    // Test the local storage
    try {
      const testCollection = db.collection('pantry');
      const testData = await testCollection.readData();
      console.log("✅ Local storage test successful. Found", testData.length, "items in pantry");
    } catch (testError) {
      console.error("❌ Local storage test failed:", testError);
      throw testError;
    }
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Simple authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    console.log('🔐 Auth middleware - received userId:', userId);
    
    if (!userId) {
      console.log('🔐 Auth middleware - no user ID provided');
      return res.status(401).json({ error: 'User ID required' });
    }
    
    // Verify user exists
    console.log('🔐 Auth middleware - looking up user in database');
    console.log('🔐 Auth middleware - using ObjectIdClass:', ObjectIdClass.name);
    console.log('🔐 Auth middleware - database type:', usingLocalStorage ? 'local-storage' : 'mongodb');
    
    const user = await db.collection('users').findOne({ _id: new ObjectIdClass(userId) });
    console.log('🔐 Auth middleware - user found:', user ? 'YES' : 'NO');
    
    if (!user) {
      console.log('🔐 Auth middleware - user not found in database');
      return res.status(401).json({ error: 'Invalid user', userId: userId });
    }
    
    req.userId = userId;
    console.log('🔐 Auth middleware - authentication successful');
    next();
  } catch (error) {
    console.error('❌ Authentication error:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

// Routes

// Get all pantry items for authenticated user
app.get('/api/pantry', authenticateUser, async (req, res) => {
  try {
    console.log('🔍 Fetching pantry items for user:', req.userId);
    console.log('🔍 Database type:', usingLocalStorage ? 'local-storage' : 'mongodb');
    
    // Test the find method step by step
    const collection = db.collection('pantry');
    console.log('🔍 Collection obtained');
    
    const findResult = collection.find({ userId: req.userId });
    console.log('🔍 Find result type:', typeof findResult);
    console.log('🔍 Find result methods:', Object.getOwnPropertyNames(findResult));
    
    const items = await findResult.toArray();
    console.log('✅ Found', items.length, 'items for user');
    res.json(items);
  } catch (error) {
    console.error('❌ Error fetching pantry items:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch pantry items' });
  }
});

// Add new pantry item for authenticated user
app.post('/api/pantry', authenticateUser, async (req, res) => {
  try {
    const newItem = {
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('pantry').insertOne(newItem);
    res.status(201).json({ ...newItem, _id: result.insertedId });
  } catch (error) {
    console.error('Error adding pantry item:', error);
    res.status(500).json({ error: 'Failed to add pantry item' });
  }
});

// Update pantry item for authenticated user
app.put('/api/pantry/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    const result = await db.collection('pantry').updateOne(
      { _id: new ObjectIdClass(id), userId: req.userId },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating pantry item:', error);
    res.status(500).json({ error: 'Failed to update pantry item' });
  }
});

// Delete pantry item for authenticated user
app.delete('/api/pantry/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.collection('pantry').deleteOne({ 
      _id: new ObjectIdClass(id), 
      userId: req.userId 
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found or unauthorized' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting pantry item:', error);
    res.status(500).json({ error: 'Failed to delete pantry item' });
  }
});

// Save generated recipes for authenticated user
app.post('/api/recipes', authenticateUser, async (req, res) => {
  try {
    const recipeData = {
      ...req.body,
      userId: req.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await db.collection('recipes').insertOne(recipeData);
    res.status(201).json({ ...recipeData, _id: result.insertedId });
  } catch (error) {
    console.error('Error saving recipe:', error);
    res.status(500).json({ error: 'Failed to save recipe' });
  }
});

// Get recent recipes for authenticated user
app.get('/api/recipes', authenticateUser, async (req, res) => {
  try {
    const recipes = await db.collection('recipes')
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    res.json(recipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Save recipe click/interaction for authenticated user
app.post('/api/recipe-clicks', authenticateUser, async (req, res) => {
  try {
    const clickData = {
      ...req.body,
      userId: req.userId,
      timestamp: new Date()
    };
    const result = await db.collection('recipe_clicks').insertOne(clickData);
    res.status(201).json({ ...clickData, _id: result.insertedId });
  } catch (error) {
    console.error('Error saving recipe click:', error);
    res.status(500).json({ error: 'Failed to save recipe click' });
  }
});

// Authentication Routes

// Sign up new user
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }
    
    // Simple password hashing (in production, use bcrypt)
    const hashedPassword = Buffer.from(password).toString('base64');
    
    // Create new user
    const newUser = {
      email,
      password: hashedPassword,
      name,
      onboardingCompleted: false, // New users need to complete onboarding
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    // Return user without password
    const userResponse = {
      _id: result.insertedId,
      email,
      name,
      full_name: name,
      createdAt: newUser.createdAt
    };
    
    res.status(201).json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Sign in user
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Simple password verification (in production, use bcrypt)
    const hashedPassword = Buffer.from(password).toString('base64');
    if (user.password !== hashedPassword) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    
    // Return user without password
    const userResponse = {
      _id: user._id,
      email: user.email,
      name: user.name,
      full_name: user.name,
      createdAt: user.createdAt
    };
    
    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Error signing in user:', error);
    res.status(500).json({ success: false, message: 'Failed to sign in' });
  }
});

// Google Sign In
app.post('/api/auth/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ success: false, message: 'Google token is required' });
    }
    
    // Verify Google token (in production, verify with Google's API)
    // For now, we'll decode the JWT token to get user info
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      const { email, name, picture, sub: googleId } = payload;
      
      // Check if user already exists
      let user = await db.collection('users').findOne({ email });
      
      if (!user) {
        // Create new user
        const newUser = {
          email,
          name,
          googleId,
          avatar: picture,
          onboardingCompleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const result = await db.collection('users').insertOne(newUser);
        user = { ...newUser, _id: result.insertedId };
      } else {
        // Update existing user with Google info if not present
        if (!user.googleId) {
          await db.collection('users').updateOne(
            { _id: user._id },
            { 
              $set: { 
                googleId, 
                avatar: picture,
                updatedAt: new Date() 
              } 
            }
          );
          user.googleId = googleId;
          user.avatar = picture;
        }
      }
      
      // Return user without sensitive data
      const userResponse = {
        _id: user._id,
        email: user.email,
        name: user.name,
        full_name: user.name,
        googleId: user.googleId,
        avatar: user.avatar,
        createdAt: user.createdAt
      };
      
      res.json({ success: true, user: userResponse, token });
    } catch (decodeError) {
      console.error('Error decoding Google token:', decodeError);
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
  } catch (error) {
    console.error('Error with Google sign in:', error);
    res.status(500).json({ success: false, message: 'Failed to sign in with Google' });
  }
});

// Update user onboarding for authenticated user
app.put('/api/users/onboarding', authenticateUser, async (req, res) => {
  console.log('=== ONBOARDING ENDPOINT CALLED ===');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  try {
    const { 
      householdSize, 
      dietaryPreferences, 
      cookingStyle, 
      cookingGoals, 
      onboardingCompleted 
    } = req.body;

    console.log('Updating onboarding for user:', req.userId);
    console.log('Onboarding data:', req.body);

    const updateData = {
      householdSize: parseInt(householdSize),
      dietaryPreferences,
      cookingStyle,
      cookingGoals,
      onboardingCompleted,
      updatedAt: new Date()
    };

    const result = await db.collection('users').updateOne(
      { _id: new ObjectIdClass(req.userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error updating user onboarding:', error);
    res.status(500).json({ error: 'Failed to update user onboarding' });
  }
});

// Get user profile for authenticated user
app.get('/api/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure user can only access their own profile
    if (id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const user = await db.collection('users').findOne(
      { _id: new ObjectIdClass(id) },
      { projection: { password: 0 } } // Exclude password from response
    );
    
    // Add full_name field if not present
    if (user && !user.full_name) {
      user.full_name = user.name;
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ShelfLife API is running',
    backend: usingLocalStorage ? 'local-storage' : 'mongodb'
  });
});

// Test local storage endpoint
app.get('/api/test-storage', async (req, res) => {
  try {
    if (!usingLocalStorage) {
      return res.json({ error: 'Not using local storage' });
    }
    
    const pantry = db.collection('pantry');
    const data = await pantry.readData();
    const userItems = data.filter(item => item.userId === 'f3cf51285e15fd40d32dfdab');
    
    res.json({
      totalItems: data.length,
      userItems: userItems.length,
      sampleItem: userItems[0] || null
    });
  } catch (error) {
    console.error('Test storage error:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Recipe Generation endpoint
app.post('/api/ai-recipes', authenticateUser, async (req, res) => {
  try {
    const { pantryItems, dietaryPreferences, householdSize } = req.body;
    
    console.log('🤖 AI Recipe Generation Request:', {
      pantryItems: pantryItems?.length || 0,
      dietaryPreferences,
      householdSize
    });

    // Build the prompt for the AI
    const availableIngredients = pantryItems?.map(item => item.name).join(', ') || 'common pantry ingredients';
    const dietaryConstraints = dietaryPreferences?.length > 0 ? 
      `Please ensure the recipe is ${dietaryPreferences.join(', ')}.` : '';
    
    const prompt = `Create a detailed recipe using these ingredients: ${availableIngredients}. ${dietaryConstraints}

You are a creative chef. Create a unique, delicious recipe that uses the available ingredients and follows any dietary restrictions.

CRITICAL: You must respond with ONLY a valid JSON object. Do not include any text before or after the JSON. Do not use markdown formatting. Just the raw JSON:

{
  "recipeName": "Creative and catchy recipe name",
  "description": "A brief, appetizing description of the dish",
  "servingSize": "Serves ${householdSize || 2-3}",
  "ingredients": ["2 tomatoes", "1 onion", "2 cloves garlic"],
  "instructions": ["Step 1: detailed instruction", "Step 2: detailed instruction"],
  "cookTime": "25 minutes",
  "difficulty": "Easy",
  "funFact": "An interesting cooking tip or food fact related to this recipe"
}

Make the recipe creative, practical, and delicious. Use the available ingredients as the main components.`;

    console.log('📝 Sending prompt to Ollama...');
    
    // Call Ollama API
    const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: `You are a JSON-only recipe generator. Respond with ONLY valid JSON, no other text.

${prompt}`,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9
        }
      })
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status}`);
    }

    const ollamaData = await ollamaResponse.json();
    console.log('🤖 Ollama response received');

    // Try to parse the AI response as JSON
    let recipeData;
    try {
      // Clean the response - remove any markdown formatting
      let cleanedResponse = ollamaData.response.trim();
      
      // Remove markdown code blocks if present
      cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      // Try to find JSON object in the response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed AI recipe JSON');
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.log('⚠️ Failed to parse AI response as JSON, using fallback');
      console.log('AI Response:', ollamaData.response);
      console.log('Parse Error:', parseError.message);
      
      // Fallback: create a recipe from the text response
      recipeData = {
        recipeName: "AI-Generated Recipe",
        description: ollamaData.response.substring(0, 200) + "...",
        servingSize: `Serves ${householdSize || 2-3}`,
        ingredients: ["Available ingredients", "Common pantry items"],
        instructions: ["Follow the AI-generated instructions above"],
        cookTime: "30 minutes",
        difficulty: "Medium",
        funFact: "This recipe was generated by AI using your pantry items!"
      };
    }

    // Ensure all required fields exist
    const recipe = {
      recipeName: recipeData.recipeName || "AI-Generated Recipe",
      description: recipeData.description || "A delicious recipe created just for you",
      servingSize: recipeData.servingSize || `Serves ${householdSize || 2-3}`,
      ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : ["Available ingredients"],
      instructions: Array.isArray(recipeData.instructions) ? 
        recipeData.instructions.map(instruction => 
          typeof instruction === 'string' ? instruction : instruction.step || instruction.toString()
        ) : ["Follow the recipe instructions"],
      cookTime: recipeData.cookTime || "30 minutes",
      difficulty: recipeData.difficulty || "Medium",
      funFact: recipeData.funFact || "This recipe was personalized for your pantry and preferences!"
    };

    console.log('✅ AI Recipe generated successfully:', recipe.recipeName);
    
    res.json({
      success: true,
      recipe: recipe,
      aiGenerated: true
    });

  } catch (error) {
    console.error('❌ AI Recipe generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI recipe',
      details: error.message
    });
  }
});

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback to index.html for SPA routes (after API and static routes)
app.get('*', (req, res, next) => {
  // Only handle non-API requests
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Start server
async function startServer() {
  await connectToMongo();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await client.close();
  process.exit(0);
});