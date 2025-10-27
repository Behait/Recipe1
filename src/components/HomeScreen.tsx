import React, { useState } from 'react';
import IngredientInput from './IngredientInput';
import RecipeDisplay from './RecipeDisplay';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import Welcome from './Welcome';
import RecipeOptionsList from './RecipeOptionsList';
import RecipeOfTheDay from './RecipeOfTheDay';
import { generateRecipeOptions, generateRecipeDetails } from '../services/geminiService';
import type { Recipe } from '../types';

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
