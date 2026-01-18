
import React from 'react';
import { RecycleIcon } from './icons/RecycleIcon';
import { LeafIcon } from './icons/LeafIcon';
import { SingleRecipe } from '../types';
import { HomeActionCard } from './HomeActionCard';

const recipeImages = [
  'https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/704569/pexels-photo-704569.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/842571/pexels-photo-842571.jpeg?auto=compress&cs=tinysrgb&w=600'
];

const trendingRecipes: SingleRecipe[] = [
    {
        recipeName: "Classic Tomato Pasta",
        description: "A timeless Italian dish with a rich and savory tomato sauce, fresh basil, and perfectly cooked pasta.",
        ingredients: [
            { name: "Pasta (Spaghetti or Penne)", notes: "Pantry staple" },
            { name: "Canned Tomatoes", notes: "Pantry staple" },
            { name: "Garlic", notes: "Produce" },
            { name: "Onion", notes: "Produce" },
            { name: "Fresh Basil", notes: "Produce" },
            { name: "Olive Oil", notes: "Pantry staple" },
            { name: "Salt & Pepper", notes: "Pantry staple" }
        ],
        instructions: [
            "Boil pasta according to package directions.",
            "While pasta is cooking, sauté chopped onion and garlic in olive oil until softened.",
            "Add canned tomatoes, break them up with a spoon, and simmer for 15-20 minutes.",
            "Season the sauce with salt and pepper to taste.",
            "Drain the pasta and toss it with the sauce.",
            "Garnish with fresh basil before serving."
        ]
    },
    {
        recipeName: "Fluffy Berry Pancakes",
        description: "Start your day with these light and fluffy pancakes, bursting with the sweetness of fresh berries.",
        ingredients: [
            { name: "All-purpose Flour", notes: "Pantry staple" },
            { name: "Baking Powder", notes: "Pantry staple" },
            { name: "Sugar", notes: "Pantry staple" },
            { name: "Egg", notes: "Produce" },
            { name: "Milk", notes: "Produce" },
            { name: "Butter, melted", notes: "Produce" },
            { name: "Mixed Berries (fresh or frozen)", notes: "Produce" }
        ],
        instructions: [
            "In a large bowl, whisk together flour, baking powder, and sugar.",
            "In a separate bowl, whisk the egg and milk, then stir in the melted butter.",
            "Pour the wet ingredients into the dry ingredients and mix until just combined (do not overmix).",
            "Gently fold in the mixed berries.",
            "Heat a lightly oiled griddle or frying pan over medium-high heat.",
            "Pour or scoop the batter onto the griddle, using approximately 1/4 cup for each pancake.",
            "Cook until bubbles appear on the surface, then flip and cook until golden brown."
        ]
    },
     {
        recipeName: "Gourmet Burger & Fries",
        description: "A juicy, perfectly seasoned burger on a toasted bun, served with crispy, golden-brown fries.",
        ingredients: [
            { name: "Ground Beef", notes: "Meat" },
            { name: "Burger Buns", notes: "Bakery" },
            { name: "Cheddar Cheese", notes: "Dairy" },
            { name: "Lettuce", notes: "Produce" },
            { name: "Tomato", notes: "Produce" },
            { name: "Onion", notes: "Produce" },
            { name: "Potatoes (for fries)", notes: "Produce" },
            { name: "Vegetable Oil (for frying)", notes: "Pantry staple" }
        ],
        instructions: [
            "Preheat grill or pan to medium-high heat.",
            "Form ground beef into patties and season with salt and pepper.",
            "Grill patties for 4-5 minutes on each side, or until cooked to desired doneness.",
            "During the last minute of cooking, top with a slice of cheddar cheese.",
            "While burgers cook, cut potatoes into fries and fry in hot oil until golden and crispy.",
            "Toast the burger buns lightly on the grill.",
            "Assemble the burgers with lettuce, tomato, and onion. Serve immediately with hot fries."
        ]
    },
     {
        recipeName: "Avocado Salad Delight",
        description: "A refreshing and healthy salad featuring creamy avocado, crisp vegetables, and a zesty lime dressing.",
        ingredients: [
            { name: "Avocado", notes: "Produce" },
            { name: "Cherry Tomatoes", notes: "Produce" },
            { name: "Cucumber", notes: "Produce" },
            { name: "Red Onion", notes: "Produce" },
            { name: "Fresh Cilantro", notes: "Produce" },
            { name: "Lime Juice", notes: "Produce" },
            { name: "Olive Oil", notes: "Pantry staple" },
            { name: "Salt & Pepper", notes: "Pantry staple" }
        ],
        instructions: [
            "Chop the avocado, cherry tomatoes, cucumber, and red onion into bite-sized pieces.",
            "Finely chop the fresh cilantro.",
            "In a large bowl, combine all the chopped vegetables and cilantro.",
            "In a small bowl, whisk together the lime juice, olive oil, salt, and pepper to create the dressing.",
            "Pour the dressing over the salad and toss gently to combine.",
            "Serve immediately for the best flavor and texture."
        ]
    }
];

interface HomeScreenProps {
  onStart: () => void;
  onStartZeroWaste: () => void;
  onSelectRecipe: (recipe: SingleRecipe) => void;
}

const TrendingRecipeCard: React.FC<{recipe: SingleRecipe, imgSrc: string, onSelect: () => void}> = ({recipe, imgSrc, onSelect}) => (
    <button onClick={onSelect} className="text-left bg-card dark:bg-dark-card rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-primary">
        <img src={imgSrc} alt={`A plate of freshly made ${recipe.recipeName}`} className="w-full h-40 object-cover"/>
        <div className="p-4">
            <h3 className="font-semibold text-lg text-text-primary dark:text-dark-text-primary">{recipe.recipeName}</h3>
        </div>
    </button>
)

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart, onStartZeroWaste, onSelectRecipe }) => {
  return (
    <>
      {/* Hero Section */}
      <header className="relative h-80 flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-black opacity-50 -z-20"></div>
        <img 
          src="https://images.pexels.com/photos/1640777/pexels-photo-1640.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
          alt="" 
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover -z-10"
        />
        <div className="z-10 text-center p-4">
          <h1 className="font-display text-7xl md:text-8xl">Cooksy</h1>
          <p className="mt-4 text-xl text-gray-200 font-light">
            Your smart kitchen assistant.
          </p>
        </div>
      </header>

      {/* Main Actions Section */}
      <section aria-labelledby="actions-title" className="max-w-4xl mx-auto -mt-20 relative z-20 p-4">
        <h2 id="actions-title" className="sr-only">Main Actions</h2>
        <div className="grid md:grid-cols-2 gap-8 bg-card/90 dark:bg-dark-card/90 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-border dark:border-dark-border">
          
          <HomeActionCard 
            icon={<LeafIcon className="w-16 h-16 text-primary dark:text-dark-primary"/>}
            title="Plan Your Meals"
            description="Get a custom meal plan based on your diet, budget, and taste."
            buttonText="Start Planning"
            onClick={onStart}
            theme="primary"
          />
          
          <HomeActionCard 
            icon={<RecycleIcon className="w-16 h-16 text-accent-dark dark:text-dark-accent-dark"/>}
            title="Use Up Leftovers"
            description="Snap photos of your fridge & get a recipe to reduce waste."
            buttonText="Use My Leftovers"
            onClick={onStartZeroWaste}
            theme="accent"
          />

        </div>
      </section>


      {/* Trending Recipes Section */}
      <section aria-labelledby="trending-title" className="max-w-6xl mx-auto p-6 md:p-12 mt-8">
        <div className="text-center">
            <h2 id="trending-title" className="text-4xl font-display text-primary-dark dark:text-dark-primary-dark mb-8">Latest trending recipes</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
               {trendingRecipes.map((recipe, index) => (
                 <TrendingRecipeCard 
                    key={index}
                    recipe={recipe}
                    imgSrc={recipeImages[index]}
                    onSelect={() => onSelectRecipe(recipe)}
                 />
               ))}
            </div>
        </div>
      </section>
    </>
  );
};

export default HomeScreen;