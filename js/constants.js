const api_url = "https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=";
const api_url_ingredients = "https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=";

const categories = ["Ordinary Drink", "Cocktail", "Milk / Float / Shake", "Other/Unknown", "Cocoa", "Shot", "Coffee / Tea", "Homemade Liqueur", "Punch / Party Drink", "Beer", "Soft Drink / Soda"];
const amountOfQuestions = { min: 1, max: 100 };

const defaultPreferences = {
  category: "Beer",
  limit: 10,
};

export { api_url, api_url_ingredients, categories, amountOfQuestions, defaultPreferences };
