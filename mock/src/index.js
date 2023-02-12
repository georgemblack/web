import express from "express";
import posts from "./data/posts.js";
import likes from "./data/likes.js";

const app = express();
app.use(express.json());
const port = process.env.PORT || 9000;

app.post("/auth", (req, res) => {
  res.status(200).send({ token: "mock-token"});
});

app.get("/likes", async (req, res) => {
  res.header("Content-Type", "application/json");
  res.status(200).send({ likes: likes });
});

app.get("/posts", async (req, res) => {
  res.header("Content-Type", "application/json");
  res.status(200).send({ posts: posts });
});

app.listen(port, () => console.log(`Listening on port ${port}`));
