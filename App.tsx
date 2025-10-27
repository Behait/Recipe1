import React, { useState, useEffect } from 'https://esm.sh/react@^19.2.0';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import HomeScreen from './components/HomeScreen.tsx';
import SavedRecipes from './components/SavedRecipes.tsx';
import { generateRecipeOfTheDay } from './services/geminiService.ts';
import type { Recipe } from './types.ts';

const App: React.FC = () => {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);

  const [recipeOfTheDay, setRecipeOfTheDay] = useState<Recipe | null>(null);
  const [isRotdLoading, setIsRotdLoading] = useState(true);
  const [rotdError, setRotdError] = useState<string | null>(null);

  useEffect(() => {
    // Load saved recipes from local storage
    try {
      const storedRecipes = localStorage.getItem('savedRecipes');
      if (storedRecipes) {
        setSavedRecipes(JSON.parse(storedRecipes));
      }
    } catch (error) {
      console.error("Failed to load recipes from local storage", error);
    }

    // Load or fetch Recipe of the Day
    const fetchRecipeOfTheDay = async () => {
      setIsRotdLoading(true);
      setRotdError(null);
      const today = new Date().toISOString().split('T')[0];
      const cacheKey = `recipeOfTheDay-${today}`;
      
      try {
        const cachedData = localStorage.getItem(cacheKey);
        if (cachedData) {
          setRecipeOfTheDay(JSON.parse(cachedData));
        } else {
          // Clear old caches to prevent local storage bloat
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('recipeOfTheDay-')) {
              localStorage.removeItem(key);
            }
          });
          
          const recipe = await generateRecipeOfTheDay();
          localStorage.setItem(cacheKey, JSON.stringify(recipe));
          setRecipeOfTheDay(recipe);
        }
      } catch (error: any) {
        console.error("Failed to fetch Recipe of the Day", error);
        setRotdError(error.message || "无法加载今日推荐菜谱。");
      } finally {
        setIsRotdLoading(false);
      }
    };

    fetchRecipeOfTheDay();
  }, []);

  const handleSaveRecipe = (recipeToSave: Recipe) => {
    setSavedRecipes(prevRecipes => {
      if (prevRecipes.some(r => r.recipeName === recipeToSave.recipeName)) {
         return prevRecipes;
      }
      const newRecipe = { ...recipeToSave, id: recipeToSave.id || new Date().toISOString() };
      const updatedRecipes = [...prevRecipes, newRecipe];
      try {
        localStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
      } catch (error) {
        console.error("Failed to save recipes to local storage", error);
      }
      
      if (currentRecipe && currentRecipe.recipeName === newRecipe.recipeName) {
         setCurrentRecipe(newRecipe);
      }
      if (recipeOfTheDay && recipeOfTheDay.recipeName === newRecipe.recipeName) {
        setRecipeOfTheDay(newRecipe)
      }

      return updatedRecipes;
    });
  };

  const handleDeleteRecipe = (recipeId: string) => {
    setSavedRecipes(prevRecipes => {
      const updatedRecipes = prevRecipes.filter(r => r.id !== recipeId);
      try {
        localStorage.setItem('savedRecipes', JSON.stringify(updatedRecipes));
      } catch (error) {
        console.error("Failed to save recipes to local storage", error);
      }
      return updatedRecipes;
    });
  };
  
  const handleViewRecipe = (recipe: Recipe) => {
    setCurrentRecipe(recipe);
    setShowSaved(false);
  };
  
  const handleSetCurrentRecipe = (recipe: Recipe | null) => {
      setCurrentRecipe(recipe);
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <Header onToggleSaved={() => setShowSaved(true)} />
      <main className="container mx-auto p-4 flex-grow w-full max-w-4xl">
         <HomeScreen 
            currentRecipe={currentRecipe}
            setCurrentRecipe={handleSetCurrentRecipe}
            onSaveRecipe={handleSaveRecipe}
            recipeOfTheDay={recipeOfTheDay}
            isRotdLoading={isRotdLoading}
            rotdError={rotdError}
         />
      </main>
      {showSaved && (
        <SavedRecipes
          recipes={savedRecipes}
          onView={handleViewRecipe}
          onDelete={handleDeleteRecipe}
          onClose={() => setShowSaved(false)}
        />
      )}
      <Footer />
    </div>
  );
};

export default App;