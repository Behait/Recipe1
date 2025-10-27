import React, { useState } from 'https://esm.sh/react@^19.2.0';
import IngredientInput from './IngredientInput.tsx';
import RecipeDisplay from './RecipeDisplay.tsx';
import LoadingSpinner from './LoadingSpinner.tsx';
import ErrorMessage from './ErrorMessage.tsx';
import Welcome from './Welcome.tsx';
import RecipeOptionsList from './RecipeOptionsList.tsx';
import RecipeOfTheDay from './RecipeOfTheDay.tsx';
import { generateRecipeOptions, generateRecipeDetails } from '../services/geminiService.ts';
import type { Recipe } from '../types.ts';

interface HomeScreenProps {
  currentRecipe: Recipe | null;
  setCurrentRecipe: (recipe: Recipe | null) => void;
  onSaveRecipe: (recipe: Recipe) => void;
  recipeOfTheDay: Recipe | null;
  isRotdLoading: boolean;
  rotdError: string | null;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  currentRecipe, 
  setCurrentRecipe, 
  onSaveRecipe,
  recipeOfTheDay,
  isRotdLoading,
  rotdError
}) => {
  const [ingredients, setIngredients] = useState('');
  const [recipeOptions, setRecipeOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const handleGenerateRecipes = async () => {
    if (!ingredients.trim()) return;
    setIsGeneratingOptions(true);
    setIsGeneratingDetails(false);
    setError(null);
    setRetryAction(null);
    setCurrentRecipe(null);
    setRecipeOptions([]);
    setSelectedOption(null);

    try {
      const options = await generateRecipeOptions(ingredients);
      setRecipeOptions(options);
    } catch (e: any) {
      setError(e.message || '生成菜谱建议时发生未知错误。');
      setRetryAction(() => handleGenerateRecipes);
    } finally {
      setIsGeneratingOptions(false);
    }
  };

  const handleSelectRecipeOption = async (recipeName: string) => {
    setSelectedOption(recipeName);
    setIsGeneratingDetails(true);
    setError(null);
    setRetryAction(null);
    setCurrentRecipe(null);
    
    try {
      const recipeDetails = await generateRecipeDetails(recipeName, ingredients);
      setCurrentRecipe(recipeDetails);
    } catch (e: any) {
      setError(e.message || `获取“${recipeName}”的详细信息时发生未知错误。`);
      setRetryAction(() => () => handleSelectRecipeOption(recipeName));
    } finally {
      setIsGeneratingDetails(false);
    }
  };
  
  const handleStartOver = () => {
    setCurrentRecipe(null);
    setRecipeOptions([]);
    setIngredients('');
    setError(null);
    setRetryAction(null);
    setSelectedOption(null);
    setIsGeneratingOptions(false);
    setIsGeneratingDetails(false);
  };
  
  const handleViewRecipeOfTheDay = () => {
    if (recipeOfTheDay) {
        // Clear any user-input state before showing recipe of the day
        handleStartOver();
        setCurrentRecipe(recipeOfTheDay);
    }
  }

  const showWelcome = !isGeneratingOptions && !isGeneratingDetails && !error && recipeOptions.length === 0 && !currentRecipe;

  return (
    <div className="w-full space-y-6">
      <IngredientInput
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        onSubmit={handleGenerateRecipes}
        isLoading={isGeneratingOptions}
      />
      
      {isGeneratingOptions && <LoadingSpinner />}
      
      {error && !selectedOption && <ErrorMessage message={error} onRetry={retryAction || undefined} />}

      {recipeOptions.length > 0 && (
        <RecipeOptionsList 
            options={recipeOptions} 
            onSelect={handleSelectRecipeOption}
            selectedOption={selectedOption}
        />
      )}
      
      {isGeneratingDetails && <LoadingSpinner />}
      
      {error && selectedOption && <ErrorMessage message={error} onRetry={retryAction || undefined} />}
      
      {currentRecipe && !isGeneratingDetails && (
        <RecipeDisplay 
          recipe={currentRecipe}
          onSave={onSaveRecipe}
          onStartOver={handleStartOver}
        />
      )}

      {showWelcome && (
        <>
          <Welcome />
          <RecipeOfTheDay 
              recipe={recipeOfTheDay}
              isLoading={isRotdLoading}
              error={rotdError}
              onView={handleViewRecipeOfTheDay}
          />
        </>
      )}
    </div>
  );
};

export default HomeScreen;