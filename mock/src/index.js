import express from "express";
import posts from "./data/posts.js";
import likes from "./data/likes.js";

const app = express();
app.use(express.json());
const port = process.env.PORT || 9000;

app.post("/auth", (req, res) => {
  res.status(200).send({ token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJPbmxpbmUgSldUIEJ1aWxkZXIiLCJpYXQiOjE2NzYxNjQwMjEsImV4cCI6MTcwNzcwMDAyMSwiYXVkIjoid3d3LmV4YW1wbGUuY29tIiwic3ViIjoianJvY2tldEBleGFtcGxlLmNvbSIsIkdpdmVuTmFtZSI6IkpvaG5ueSIsIlN1cm5hbWUiOiJSb2NrZXQiLCJFbWFpbCI6Impyb2NrZXRAZXhhbXBsZS5jb20iLCJSb2xlIjpbIk1hbmFnZXIiLCJQcm9qZWN0IEFkbWluaXN0cmF0b3IiXX0.7D8EeZkX8uNKMiMuUXpd0isKQwvFK3c3BTiMMnQvzZY"});
});

app.get("/likes", async (req, res) => {
  res.header("Content-Type", "application/json");
  res.status(200).send({ likes: likes });
});

app.get("/posts", async (req, res) => {
  res.header("Content-Type", "application/json");
  res.status(200).send({ posts: posts });
});

// Requests to R2 cloud storage
app.put("/", async (req, res) => {
  res.status(200).send();
});

app.listen(port, () => console.log(`Listening on port ${port}`));
