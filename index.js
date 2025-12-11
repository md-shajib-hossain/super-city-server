const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middle ware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xg4rh8d.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db("super_city_db");
    const issuesCollection = db.collection("issues");

    // all issues get api
    app.get("/all-issues", async (req, res) => {
      const result = await issuesCollection.find().toArray();
      res.send(result);
    });
    // resolved issue get api, sorted by status [resolved]
    app.get("/", async (req, res) => {
      const query = { status: "resolved" };
      const result = await issuesCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.send({ success: true, result });
    });

    // get issue by id api

    app.get("/issue/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await issuesCollection.findOne(query);

      res.send({ success: true, result });
    });

    // all issues post api
    app.post("/all-issues", async (req, res) => {
      const issue = req.body;
      const result = await issuesCollection.insertOne(issue);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);
//
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
