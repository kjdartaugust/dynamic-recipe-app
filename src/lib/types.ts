export interface Profile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at?: string
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
  category_id: string | null
  prep_time: number | null
  cook_time: number | null
  servings: number | null
  difficulty: string | null
  is_public: boolean
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
  categories: Category | null
  tags?: Tag[]
}

export interface ShoppingListItem {
  name: string
  amount?: number
  unit?: string
  checked: boolean
  recipe_id?: string
  recipe_title?: string
}

export interface ShoppingList {
  id: string
  user_id: string
  title: string
  items: ShoppingListItem[]
  created_at: string
  updated_at: string
}

export interface Rating {
  id: string
  recipe_id: string
  user_id: string
  rating: number
  review: string | null
  created_at: string
  updated_at: string
  profiles?: Profile | null
}

export interface MealPlan {
  id: string
  user_id: string
  week_start: string
  meals: Record<string, Record<string, string | null>>
  created_at: string
  updated_at: string
}
