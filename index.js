const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "database.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3004, () => {
      console.log("Server Running at http://localhost:3004/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

app.use(express.json());
module.exports = app;
/* Create API to initialize the database. fetch the JSON from the third party API and
initialize the database with seed data. */
app.get("/get", async(request, response) => {
  const statement = `
  SELECT * 
  FROM 
  apiData;
  `;
  const val = await db.all(statement)
  response.send(val);

});

// Create an API to list the all transactions
app.get("/required", async(request, response) => {
   const {search, limit, offset} = request.query
   // console.log(search, limit, offset)
   const query = `
   SELECT * 
   FROM 
   apiData
   WHERE 
   title LIKE "%${search}%" OR description LIKE "%${search}%"
   LIMIT ${limit}
   OFFSET ${offset};
    `;
  const data = await db.all(query)
  response.send(data)
})


// Create an API for statistics 
app.get("/statistics/:month", async(request, response) => {
  const {month} = request.params 
  const query = `
  SELECT 
  SUM(price) AS total_amount,
  FROM 
  apiData
  WHERE 
  strftime("%m", dateOfSale) = "${month}";
  `;
  const data = await db.get(query)
  response.send(data);
})

/* Create an API for bar chart ( the response should contain price range and the number
of items in that range for the selected month regardless of the year ) */

app.get("/barChart/:month", async(request, response) => {
  const {month}= request.params;
  const query = `
        SELECT
            SUM(CASE WHEN price >= 0 AND price <= 100 THEN 1 ELSE 0 END) AS range_0_100,
            SUM(CASE WHEN price > 100 AND price <= 200 THEN 1 ELSE 0 END) AS range_101_200,
            SUM(CASE WHEN price > 200 AND price <= 300 THEN 1 ELSE 0 END) AS range_201_300,
            SUM(CASE WHEN price > 300 AND price <= 400 THEN 1 ELSE 0 END) AS range_301_400,
            SUM(CASE WHEN price > 400 AND price <= 500 THEN 1 ELSE 0 END) AS range_401_500,
            SUM(CASE WHEN price > 500 AND price <= 600 THEN 1 ELSE 0 END) AS range_501_600,
            SUM(CASE WHEN price > 600 AND price <= 700 THEN 1 ELSE 0 END) AS range_601_700,
            SUM(CASE WHEN price > 700 AND price <= 800 THEN 1 ELSE 0 END) AS range_701_800,
            SUM(CASE WHEN price > 800 AND price <= 900 THEN 1 ELSE 0 END) AS range_801_900,
            SUM(CASE WHEN price > 900 THEN 1 ELSE 0 END) AS range_901_above
        FROM apiData
        WHERE strftime('%m', dateOfSale) = "${month}";`;

        const data = await db.get(query);
        response.send(data);
})

/* Create an API for pie chart Find unique categories and number of items from that
category for the selected month regardless of the year. */ 

app.get("/pieChart/:month", async(request, response) => {
  const {month}= request.params;
  const query = `
        SELECT category, COUNT(*) as itemCount
        FROM apiData
        WHERE strftime('%m', dateOfSale) = "${month}"
        GROUP BY category;`;

        const data = await db.get(query);
        response.send(data);
})


const apis = [
  "GET http://localhost:3004/statistics/03",
  
  "GET http://localhost:3004/barChart/05",
  
  "GET http://localhost:3004/pieChart/09"
]


app.get('/api/combined', async (request, response) => {
  try {
      const apiData = await Promise.all(apis.map(endpoint => axios.get(endpoint)));

      const combinedResponse = apiData.map(response => response.data);

      response.json(combinedResponse);
  } catch (error) {
      response.status(500).json({ error: 'Failed to fetch and combine data' });
  }
});



