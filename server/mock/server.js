import app from "./app.js";
const port = Number(process.env.MOCK_API_PORT || 3001);

app.listen(port, "127.0.0.1", () => {
  console.log(`Mock API listening on http://127.0.0.1:${port}/api`);
});
