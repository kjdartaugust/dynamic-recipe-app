// Native IndexedDB wrapper for offline caching
// No external dependencies

interface RecipeCache {
  id: string;
  title: string;
  description: string;
  instructions: string;
  ingredients: Array<{ name: string; amount: number; unit: string }>;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: string;
  image_url?: string;
  cached_at: number;
}

interface ShoppingListCache {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  checked: boolean;
  synced: boolean;
}

const DB_NAME = "zerowaste-offline";
const DB_VERSION = 1;
const MAX_CACHED_RECIPES = 50;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("recipes")) {
        db.createObjectStore("recipes", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("shoppingList")) {
        db.createObjectStore("shoppingList", { keyPath: "id" });
      }
    };
  });
}

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Recipe cache functions
export async function cacheRecipe(recipe: RecipeCache): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("recipes", "readwrite");
  const store = tx.objectStore("recipes");

  // Check count
  const all = await promisifyRequest(store.getAll());
  if (all.length >= MAX_CACHED_RECIPES) {
    const oldest = all.sort((a, b) => a.cached_at - b.cached_at)[0];
    if (oldest) {
      await promisifyRequest(store.delete(oldest.id));
    }
  }

  await promisifyRequest(store.put({ ...recipe, cached_at: Date.now() }));
  db.close();
}

export async function getCachedRecipe(id: string): Promise<RecipeCache | undefined> {
  const db = await openDB();
  const tx = db.transaction("recipes", "readonly");
  const result = await promisifyRequest(tx.objectStore("recipes").get(id));
  db.close();
  return result;
}

export async function getAllCachedRecipes(): Promise<RecipeCache[]> {
  const db = await openDB();
  const tx = db.transaction("recipes", "readonly");
  const result = await promisifyRequest(tx.objectStore("recipes").getAll());
  db.close();
  return result || [];
}

export async function removeCachedRecipe(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("recipes", "readwrite");
  await promisifyRequest(tx.objectStore("recipes").delete(id));
  db.close();
}

export async function isRecipeCached(id: string): Promise<boolean> {
  const db = await openDB();
  const tx = db.transaction("recipes", "readonly");
  const result = await promisifyRequest(tx.objectStore("recipes").get(id));
  db.close();
  return !!result;
}

// Shopping list cache functions
export async function cacheShoppingList(items: ShoppingListCache[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("shoppingList", "readwrite");
  const store = tx.objectStore("shoppingList");
  await promisifyRequest(store.clear());
  for (const item of items) {
    await promisifyRequest(store.put(item));
  }
  db.close();
}

export async function getCachedShoppingList(): Promise<ShoppingListCache[]> {
  const db = await openDB();
  const tx = db.transaction("shoppingList", "readonly");
  const result = await promisifyRequest(tx.objectStore("shoppingList").getAll());
  db.close();
  return result || [];
}

export async function addShoppingListItem(item: ShoppingListCache): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("shoppingList", "readwrite");
  await promisifyRequest(tx.objectStore("shoppingList").put({ ...item, synced: false }));
  db.close();
}

export async function updateShoppingListItem(id: string, updates: Partial<ShoppingListCache>): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("shoppingList", "readwrite");
  const store = tx.objectStore("shoppingList");
  const existing = await promisifyRequest(store.get(id));
  if (existing) {
    await promisifyRequest(store.put({ ...existing, ...updates, synced: false }));
  }
  db.close();
}

export async function removeShoppingListItem(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("shoppingList", "readwrite");
  await promisifyRequest(tx.objectStore("shoppingList").delete(id));
  db.close();
}

export async function getUnsyncedShoppingListItems(): Promise<ShoppingListCache[]> {
  const db = await openDB();
  const tx = db.transaction("shoppingList", "readonly");
  const all = await promisifyRequest(tx.objectStore("shoppingList").getAll());
  db.close();
  return (all || []).filter((item: ShoppingListCache) => !item.synced);
}

export async function markShoppingListSynced(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("shoppingList", "readwrite");
  const store = tx.objectStore("shoppingList");
  const item = await promisifyRequest(store.get(id));
  if (item) {
    await promisifyRequest(store.put({ ...item, synced: true }));
  }
  db.close();
}

export async function clearShoppingListCache(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("shoppingList", "readwrite");
  await promisifyRequest(tx.objectStore("shoppingList").clear());
  db.close();
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}
