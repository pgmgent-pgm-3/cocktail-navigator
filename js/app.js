import * as CS from "./constants.js";
import { readFromStorage, writeToStorage } from "./storage.js";

const app = {
  async init() {
    // get stored preferences of default preferences
    this.preferences = readFromStorage("preferences") || CS.defaultPreferences;

    // DOM functionality
    this.cacheElements();
    this.registerListeners();
    this.showComponent("preferences");

    // get cocktails
    this.cocktails = readFromStorage("cocktails") || (await this.fetchCocktails());
    this.activeCocktailId = null;
    this.counter = null;
  },
  cacheElements() {
    this.$navItems = document.querySelectorAll("nav#primary_navigation li a");

    this.$appComponents = document.querySelectorAll("#app > div.component");
    this.$componentPreferences = document.querySelector("#app #preferences");
    this.$componentCocktails = document.querySelector("#app #cocktails");

    this.$form = document.querySelector("#preferences form");
    this.$formSelectCategory = document.querySelector("form #category");
    this.$formInputAmount = document.querySelector("form #amount");
    this.$formValueAmount = document.querySelector("form #amount_value");
  },
  registerListeners() {
    // on form submit
    this.$form.addEventListener("submit", (e) => {
      e.preventDefault();

      // get form data
      const formData = new FormData(this.$form);

      // set preferences & write to storage
      this.preferences = {
        category: formData.get("category"),
        limit: formData.get("amount"),
      };
      writeToStorage("preferences", this.preferences);

      // update cocktails
      this.fetchCocktails().then((cocktails) => {
        this.cocktails = cocktails;
      });
    });

    // on range change
    this.$formInputAmount.addEventListener("input", (e) => {
      // update amount value next to label
      this.$formValueAmount.innerHTML = e.target.value;
    });

    // primary navigation
    this.$navItems.forEach((navItem) => {
      navItem.addEventListener("click", (e) => {
        e.preventDefault();

        // remove active class from all nav items
        for (const link of this.$navItems) {
          link.className = "nav_item";
        }

        // add active class to clicked nav item
        e.target.classList.add("active");

        // show the clicked component
        this.showComponent(e.target.dataset.href);
      });
    });

    // cocktail navigation
    this.$componentCocktails.addEventListener("click", (e) => {
      e.preventDefault();
      if (e.target.id != "next") return false; // ignore any click except on next button

      // get the next active cocktail by doing a find method on our cocktails
      const nextActiveCocktail = this.cocktails.find((cocktail, index) => {
        // if the previous cocktail is the current cocktail…
        // then this cocktail will be the next one we want to show
        if (this.cocktails[index - 1] && this.activeCocktailId == this.cocktails[index - 1].idDrink) {
          return true;
        }
      });

      if (nextActiveCocktail) {
        // set new active cocktail id
        this.activeCocktailId = nextActiveCocktail.idDrink;
        this.counter++;

        // toggle visible cocktail
        document.querySelector(".cocktail:not(.hide)").classList.add("hide"); // hide the visible cocktail
        document.querySelector(`.cocktail[data-id="${this.activeCocktailId}"]`).classList.remove("hide"); // show the next cocktail
        document.querySelector("span#counter").innerHTML = this.counter; // update the counter element
      } else {
        // do anything after last cocktail is viewed;
        alert("Laatste cocktail");
      }
    });
  },
  async fetchCocktails() {
    // get data from api
    const response = await fetch(CS.api_url + this.preferences.category);
    const data = await response.json();

    // limit amount to set maximum
    let drinks = data.drinks.slice(0, this.preferences.limit);

    // (optional) fetch again to obtain all details such as ingredients
    for (const drink of drinks) {
      const response = await fetch(CS.api_url_ingredients + drink.idDrink);
      const data = await response.json();
      if (!data.drinks || data.drinks.length < 0) continue;
      drink.details = data.drinks[0];
    }

    // write to localstorage for faster loading
    writeToStorage("cocktails", drinks);

    return drinks;
  },
  showComponent(component) {
    // component visibility
    this.$appComponents.forEach((c) => {
      c.style.display = c.id != component ? "none" : "block";
    });

    // show app component
    switch (component) {
      case "cocktails":
        this.showCocktails();
        break;
      case "preferences":
        this.showPreferences();
        break;
    }
  },
  showPreferences() {
    // add categories to select
    const selectOptions = CS.categories.map((category) => {
      return `<option ${category == this.preferences.category ? "selected" : ""} value="${category}">${category}</option>`;
    });
    this.$formSelectCategory.innerHTML = selectOptions.join("\n");

    // max value
    this.$formInputAmount.setAttribute("min", CS.amountOfQuestions.min);
    this.$formInputAmount.setAttribute("max", CS.amountOfQuestions.max);
    this.$formInputAmount.value = this.preferences.limit;
    this.$formValueAmount.innerHTML = this.preferences.limit;
  },
  showCocktails() {
    // cocktail counter and next button on top
    this.$componentCocktails.innerHTML = `<h2>Cocktail <span id="counter">1</span>/${this.cocktails.length}</h2>`;
    this.$componentCocktails.innerHTML += `<button id="next">Volgende</button>`;

    // iterate through every cocktail
    for (const [index, cocktail] of this.cocktails.entries()) {
      // make an array from all available ingredients
      const ingredients = [];
      for (let ing = 1; ing <= 15; ing++) {
        if (!cocktail.details[`strIngredient${ing}`]) continue;
        ingredients.push(cocktail.details[`strIngredient${ing}`]);
      }

      // set first cocktail id as active id, reset counter to 1
      if (index == 0) {
        this.activeCocktailId = cocktail.idDrink;
        this.counter = 1;
      }

      // create cocktail HTML
      const cocktailHTML = `
        <article data-id="${cocktail.idDrink}" class="${cocktail.idDrink != this.activeCocktailId ? "hide" : ""} cocktail">
            <h1>${cocktail.strDrink}</h1>
            <p>${cocktail.details.strInstructions}</p>
            <ul>
            ${ingredients.map((ingredient) => `<li>${ingredient}</li>`).join("")}
            </ul>
            <img src="${cocktail.details.strDrinkThumb}" alt="${cocktail.strDrink}" />
        </article>`;

      this.$componentCocktails.innerHTML += cocktailHTML;
    }
  },
};

// beam me up scotty
app.init();
