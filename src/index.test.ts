import express from "express";
import request from "supertest";
import axios from "axios";
import listener from "./index";

jest.mock("axios");

describe("listener-middleware-express", () => {
  const examplePath = "/";
  const exampleResponseBody = { example: "response" };
  const exampleSatelliteHost = "example-satellite.cluster.local";

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

    it("should log any errors that occur during the asynchronous POST to the satellite", () => {
      // TODO
    });

    describe(`GET requests using res.${resMethod}()`, () => {
      let response: any;

      beforeEach(async () => {
        const app = createServerWithListener();
        await request(app)
          .get(examplePath)
          .then((res) => {
            response = res;
          });
      });

      it("should allow a request to succeed", () => {
        expect(response.status).toBe(200);
        expect(response.body).toEqual(exampleResponseBody);
      });

      it("should forward the request/response to the correct satellite host and path", () => {
        const expectedSatellitePostBody = {
          req: { path: examplePath },
          res: { body: JSON.stringify(exampleResponseBody) },
        };

        expect(axios.post).toHaveBeenCalledWith(
          `${exampleSatelliteHost}/requests/GET`,
          expectedSatellitePostBody
        );
      });
    });
  });

  describe(`GET requests using res.end()`, () => {
    let response: any;

    it("should forward a request/response and specified status to the correct satellite host and path", async () => {
      const app = express();
      app.use(listener({ satelliteHost: exampleSatelliteHost }));
      app.get(examplePath, (req, res) => {
        res.status(404).end("Not found!");
      });

      await request(app)
        .get(examplePath)
        .then((res) => {
          response = res;
        });

      const expectedSatellitePostBody = {
        req: { path: examplePath },
        res: { body: "Not found!" },
      };

      expect(response.status).toBe(404);
      expect(response.body).toEqual({});
      expect(response.text).toBe("Not found!");
      expect(axios.post).toHaveBeenCalledWith(
        `${exampleSatelliteHost}/requests/GET`,
        expectedSatellitePostBody
      );
    });

    [undefined, jest.fn()].forEach((resEndArg) => {
      it(`should send a body of undefined if type '${typeof resEndArg}' is provided to res.end()`, async () => {
        const app = express();
        app.use(listener({ satelliteHost: exampleSatelliteHost }));
        app.get(examplePath, (req, res) => {
          res.end(resEndArg);
        });

        await request(app)
          .get(examplePath)
          .then((res) => {
            response = res;
          });

        const expectedSatellitePostBody = {
          req: { path: examplePath },
          res: { body: undefined },
        };

        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
        expect(response.text).toBe("");
        expect(axios.post).toHaveBeenCalledWith(
          `${exampleSatelliteHost}/requests/GET`,
          expectedSatellitePostBody
        );
      });
    });
  });
});
