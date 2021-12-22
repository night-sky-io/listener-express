import express from "express";
import request from "supertest";
import axios from "axios";
import listener from "./index";

jest.mock("axios");

describe("listener-middleware-express", () => {
  const exampleResponseBody = { example: "response" };
  const exampleSatelliteHost = "example-satellite.cluster.local";

  const createServerWithListener = () => {
    const app = express();
    app.use(listener({ satellite: exampleSatelliteHost }));
    app.get("/", (req, res) => {
      res.send(exampleResponseBody); // TODO JMB: Parameterise `.send` so it can be exchanged for others e.g. `.json` in a loop
    });
    return app;
  };

  it("should log any errors that occur during the asynchronous POST to the satellite", () => {
    // TODO
  });

  describe("GET requests using res.send()", () => {
    let response: any;

    beforeEach(async () => {
      const app = createServerWithListener();
      await request(app)
        .get("/")
        .expect(200)
        .then((res) => {
          response = res;
        });
    });

    it("should allow a request to succeed", () => {
      expect(response.body).toEqual(exampleResponseBody);
    });

    it("should forward the full request and response details to the given satellite host ", () => {
      const expectedSatellitePostBody = {
        req: { path: "/" },
        res: { body: '{"example":"response"}' },
      };

      expect(axios.post).toHaveBeenCalledWith(
        exampleSatelliteHost,
        expectedSatellitePostBody
      );
    });
  });
});
