import express from "express";
import bodyParser from "body-parser";
import request from "supertest";
import axios from "axios";
import listener, { SatellitePostBody } from "./index";

jest.mock("axios");

describe("listener-express", () => {
  const examplePath = "/";
  const exampleResponseBody = { example: "response" };
  const exampleSatelliteHost = "example-satellite.cluster.local";
  const exampleHost = "hostname";
  const exampleOrigin = "origin";

  // it("should log any errors that occur during the asynchronous POST to the satellite", () => {
  //   // TODO
  // });

  ["send", "json"].forEach((resMethod) => {
    const createServerWithListener = () => {
      const app = express();
      app.use(listener({ satelliteHost: exampleSatelliteHost }));
      app.get(examplePath, (req, res) => {
        // @ts-ignore
        res[resMethod](exampleResponseBody);
      });
      return app;
    };

    describe(`GET requests using res.${resMethod}()`, () => {
      let response: any;

      beforeEach(async () => {
        const app = createServerWithListener();
        await request(app)
          .get(examplePath)
          .set({ host: exampleHost, origin: exampleOrigin })
          .then((res) => {
            response = res;
          });
      });

      it("should allow a request to succeed", () => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual(exampleResponseBody);
      });

      it("should forward the request/response to the correct satellite host and path", () => {
        const expectedSatellitePostBody: SatellitePostBody = {
          req: {
            method: "GET",
            path: examplePath,
            query: {},
            body: undefined,
            host: exampleHost,
            origin: exampleOrigin,
          },
          res: { body: JSON.stringify(exampleResponseBody) },
        };

        expect(axios.post).toHaveBeenCalledWith(
          `${exampleSatelliteHost}/requests`,
          expectedSatellitePostBody
        );
      });
    });
  });

  describe("complex GET requests using a nested router with queries", () => {
    let response: any;

    beforeEach(async () => {
      const app = express();
      app.use(listener({ satelliteHost: exampleSatelliteHost }));

      const router1 = express.Router();
      const router2 = express.Router();
      router2.get("/level3", (req, res) => {
        res.send(exampleResponseBody);
      });
      router1.use("/level2", router2);

      app.use("/level1", router1);

      await request(app)
        .get("/level1/level2/level3?exampleQuery=value")
        .set({ host: exampleHost, origin: exampleOrigin })
        .then((res) => {
          response = res;
        });
    });

    it("should allow a request to succeed", () => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual(exampleResponseBody);
    });

    it("should forward the request/response to the correct satellite host and path", () => {
      const expectedSatellitePostBody: SatellitePostBody = {
        req: {
          method: "GET",
          path: "/level1/level2/level3",
          query: { exampleQuery: "value" },
          body: undefined,
          host: exampleHost,
          origin: exampleOrigin,
        },
        res: { body: JSON.stringify(exampleResponseBody) },
      };

      expect(axios.post).toHaveBeenCalledWith(
        `${exampleSatelliteHost}/requests`,
        expectedSatellitePostBody
      );
    });
  });

  it("should not do anything for an OPTIONS request", async () => {
    let response: any;
    const app = express();
    app.use(listener({ satelliteHost: exampleSatelliteHost }));
    app.get(examplePath, (req, res) => {
      res.send();
    });

    await request(app)
      .options(examplePath)
      .set({ host: exampleHost, origin: exampleOrigin })
      .then((res) => {
        response = res;
      });

    expect(response.status).toBe(200);
    expect(axios.post).not.toHaveBeenCalled();
  });

  describe("POST requests using res.send()", () => {
    let response: any;
    const exampleRequestBody = { example: "request body" };

    beforeEach(async () => {
      const app = express();
      app.use(bodyParser.json());
      app.use(listener({ satelliteHost: exampleSatelliteHost }));
      app.post(examplePath, (req, res) => {
        // @ts-ignore
        res.send(exampleResponseBody);
      });

      await request(app)
        .post(examplePath)
        .set({ host: exampleHost, origin: exampleOrigin })
        .send(exampleRequestBody)
        .then((res) => {
          response = res;
        });
    });

    it("should allow a request to succeed", () => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual(exampleResponseBody);
    });

    it("should forward the request/response to the correct satellite host and path", () => {
      const expectedSatellitePostBody: SatellitePostBody = {
        req: {
          method: "POST",
          path: examplePath,
          query: {},
          body: exampleRequestBody,
          host: exampleHost,
          origin: exampleOrigin,
        },
        res: { body: JSON.stringify(exampleResponseBody) },
      };

      expect(axios.post).toHaveBeenCalledWith(
        `${exampleSatelliteHost}/requests`,
        expectedSatellitePostBody
      );
    });
  });
});
