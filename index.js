const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middle ware
app.use(express.json());
app.use(cors());

// custom middleware , fb token
const verifyToken = (req, res, next) => {
  console.log("headers in the middleware", req.headers?.authorization);
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xg4rh8d.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//

//
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const db = client.db("super_city_db");
    const issuesCollection = db.collection("issues");
    const userCollection = db.collection("users");
    const timelineCollection = db.collection("timeline");
    // GET all-issues by search
    app.get("/all-issues", async (req, res) => {
      const {
        limit = 8,
        skip = 0,
        search,
        status,
        priority,
        category,
      } = req.query;

      let filter = {};

      if (search && typeof search === "string" && search.trim() !== "") {
        filter.$or = [
          { title: { $regex: search, $options: "i" } },
          { "location.address": { $regex: search, $options: "i" } },
        ];
      }
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;

      const result = await issuesCollection
        .find(filter)
        .limit(Number(limit))
        .skip(Number(skip))
        .sort({ createdAt: -1 })
        .toArray();

      const total = await issuesCollection.countDocuments(filter);

      res.send({ result, total });
    });
    // all issues get api with pagination scope
    app.get("/all-issues", async (req, res) => {
      const { limit = 0, skip = 0 } = req.query;
      const result = await issuesCollection
        .find()
        .limit(Number(limit))
        .skip(Number(skip))
        .toArray();
      const count = await issuesCollection.countDocuments();
      console.log(count, "eta dorkar");
      res.send({ result, total: count });
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

    // get my-issue by user-email
    app.get("/dashboard/my-issues/:email", async (req, res) => {
      const { email } = req.params;
      const query = { "createdBy.creatorEmail": email };
      const result = await issuesCollection.find(query).toArray();
      res.send({ success: true, result });
    });

    //  get user data from db
    app.get("/users", async (req, res) => {
      try {
        const email = req.query.email;
        if (!email) {
          return res
            .status(400)
            .json({ success: false, message: "Email is required" });
        }
        console.log(email, "this is from user email api");
        res.json({ success: true });
      } catch (error) {
        console.log(error);
      }
    });
    // all issues post api
    app.post("/all-issues", async (req, res) => {
      const issue = req.body;
      const result = await issuesCollection.insertOne(issue);
      res.send(result);
    });

    // store user in usercollection
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "citizen";
      user.createdAt = new Date();
      const email = user.email;
      const userExists = await userCollection.findOne({ email });

      if (userExists) {
        return res.send({ message: "user exists" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // likes ccount increase api
    app.patch("/all-issues/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const { likes } = req.body;
        console.log(likes, "likes barte hobe");

        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { likes: Number(likes) + 1 },
        };

        const result = await issuesCollection.updateOne(filter, updateDoc);

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to update likes" });
      }
    });

    //  create an issue from report issue form, and save it in db
    app.post("/all-issues/create-new-issue", async (req, res) => {
      const issueData = req.body;
      console.log(issueData, "this is from create issue api");
      if (!issueData) {
        return res.status(400).json({ message: "Issue data is required!" });
      }
      const issue = await issuesCollection.insertOne(issueData);
      const issueTimeline = {
        issueId: issue.insertedId,
        status: "Pending",
        likes: 0,
        message: "issue reported by citizen.",
        updatedBy: "citizen",
        createAt: new Date(),
      };
      const createIssueTimeline = await timelineCollection.insertOne(
        issueTimeline
      );
      res.json({
        message: "Report an issue send successful.",
        createIssueTimeline,
      });
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
