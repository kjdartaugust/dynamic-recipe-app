export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  instructions: string
  macros: {
    calories?: number
    protein?: number
    carbs?: number
    fat?: number
  } | null
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface Ingredient {
  id: string
  recipe_id: string
  name: string
  amount: number
  unit: string
  created_at: string
  updated_at: string
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: Ingredient[]
  profiles: Profile | null
}
