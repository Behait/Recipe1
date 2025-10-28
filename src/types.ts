export interface RecipeOption {
  name: string;
  slug: string;
}

export interface Recipe {
  id?: string;
  recipeName: string;
  description: string;
  prepTime: string;
  cookTime: string;
  ingredients: string[];
  instructions: string[];
  imageUrl?: string;
}
