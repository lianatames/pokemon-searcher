import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
const port = 3000;
const API_URL = "https://pokeapi.co/api/v2/";

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  try {
    res.render("index.ejs", {
        greeting: "Welcome!",
        message: "Start by searching for a pokemon or generating a random one."
    });
  } catch(error) {
    console.log(error.response);
    res.status(500);
  }
});

app.post("/search", async (req, res) => {
    const searchData = req.body.search;

    try {
      // Retrieve max number of pokemon
      const retrieveNumData = await axios.get(API_URL + "pokemon-species/?limit=0");
      const maxNum = retrieveNumData.data.count;

      // Returns true if data is not a number
      // If not a number search by pokemon name
      if (isNaN(searchData)) {
        // Retrieve pokemon data
        const response = await axios.get(API_URL + "pokemon/" + searchData);
        const pokemon = getPokemonData(response, maxNum);
        res.render("index.ejs", pokemon);

      } else { // Else search by pokemon ID number
        // Round number in case of decimals
        const roundedNum = Math.floor(searchData);

        // Check if the number is a valid pokemon id
        const valid = checkValidSearch(roundedNum, maxNum);
        if (!valid) {
          res.render("index.ejs", {
            error:
              "Not a valid Pokemon ID, please search between 1 and " +
              maxNum +
              ".",
          });
        } else {
          // If number valid, retrieve pokemon data
          const response = await axios.get(API_URL + "pokemon/" + roundedNum);
          const pokemon = getPokemonData(response, maxNum);
          console.log(pokemon);

          res.render("index.ejs", pokemon);
        }
      }
    } catch (error) {
      console.log(error.response);
      res.render("index.ejs", {
        error: "Not a valid pokemon.",
      });
    }
});

app.post("/random", async (req, res) => {
    try {
        // Retrieve pokemon number limit and generate random number
        const response = await axios.get(API_URL + "pokemon-species/?limit=0");
        const maxNum = response.data.count;
        const randNum = Math.floor(Math.random() * maxNum) + 1;

        const randomPkm = await axios.get(API_URL + "pokemon/" + randNum);

        const pokemon = getPokemonData(randomPkm, maxNum);
        res.render("index.ejs", pokemon);
    } catch (error) {
        console.log(error.response);
        res.status(500);
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Function to create an array containing data of a pokemon to pass to html
function getPokemonData(pokemon, maxNum){
    console.log(pokemon.data.stats);
    const pokemonData = {
        name: pokemon.data.name,
        id: pokemon.data.id,
        sprite: pokemon.data.sprites.front_default,
        height: convertHeight(pokemon.data.height),
        weight: convertWeight(pokemon.data.weight),
        types: getPokemonType(pokemon),
        stats: getPokemonStats(pokemon),
        maxNum: maxNum,
    };
    return pokemonData;
}

// Retrieves pokemon type/s and returns them in an array
function getPokemonType(pokemon) {
    const typesData = pokemon.data.types;
    const typesArray = [];
    for (let i = 0; i<typesData.length; i++){
        typesArray.push(typesData[i].type.name);
        console.log(typesArray[i]);
    }
    return typesArray;
}

// Retrieves pokemon stats and returns them in an array
function getPokemonStats(pokemon) {
    const statData = pokemon.data.stats;
    const statArray = [];
    for (let i = 0; i<statData.length; i++){
        console.log(`Stat: ${statData[i].stat.name}, Base-stat: ${statData[i].base_stat}`);
        
        statArray.push({
            name: statData[i].stat.name,
            base_stat: statData[i].base_stat
        });
    }
    return statArray;
}

// Converts height from decimetres to metres and Ft/Inch
function convertHeight(pokemonHeight){
  const heightInMetres = (pokemonHeight * 0.1).toFixed(1);
  const heightInFeetInches = Math.floor(heightInMetres * 3.2808) + '"' + Math.round(((heightInMetres * 3.2808) % 1) * 12) + "\'";

  return heightInMetres+"m ("+ heightInFeetInches + ")";
}

// Converts weight from hectograms to Kgs and Lbs
function convertWeight(pokemonWeight){
  const weightInKgs = (pokemonWeight * 0.1).toFixed(1);
  const weightInPounds = (weightInKgs * 2.205).toFixed(1);

  return weightInKgs+"kg ("+ weightInPounds + "lbs)";
}

// Check if the pokemon ID is a valid ID of an existing pokemon
function checkValidSearch(number, maxNum) {
  console.log(`Entered number: ${number}, MaxNum: ${maxNum}`);
  if (number < maxNum && number > 0) {
    return true;
  } else {
    return false;
  }
}