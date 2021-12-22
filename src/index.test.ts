import express from "express";
import request from "supertest";
import listener from "./index";

describe("listener-middleware-express", () => {
  const exampleResponseBody = { example: "response" };
  const createServerWithListener = () => {
    const app = express();
    app.use(listener);
    app.get("/", (req, res) => {
      res.send(exampleResponseBody);
    });
    return app;
  };

  it("should allow a request to succeed", async () => {
    const app = createServerWithListener();
    await request(app)
      .get("/")
      .expect(200)
      .then((response) => {
        expect(response.body).toEqual(exampleResponseBody);
      });
  });
});
