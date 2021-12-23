import express from "express";
import request from "supertest";
import axios from "axios";
import listener, { SatellitePostBody } from "./index";

jest.mock("axios");

describe("listener-express", () => {
  const examplePath = "/";
  const exampleResponseBody = { example: "response" };
  const exampleSatelliteHost = "example-satellite.cluster.local";

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

    describe(`requests using res.${resMethod}()`, () => {
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
        const expectedSatellitePostBody: SatellitePostBody = {
          req: {
            path: examplePath,
            query: {},
            method: "GET",
            headers: expect.any(Object),
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

  describe("requests using res.end()", () => {
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

      const expectedSatellitePostBody: SatellitePostBody = {
        req: {
          path: examplePath,
          method: "GET",
          query: {},
          headers: expect.any(Object),
        },
        res: { body: "Not found!" },
      };

      expect(response.status).toBe(404);
      expect(response.body).toEqual({});
      expect(response.text).toBe("Not found!");
      expect(axios.post).toHaveBeenCalledWith(
        `${exampleSatelliteHost}/requests`,
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

        const expectedSatellitePostBody: SatellitePostBody = {
          req: {
            path: examplePath,
            query: {},
            method: "GET",
            headers: expect.any(Object),
          },
          res: { body: undefined },
        };

        expect(response.status).toBe(200);
        expect(response.body).toEqual({});
        expect(response.text).toBe("");
        expect(axios.post).toHaveBeenCalledWith(
          `${exampleSatelliteHost}/requests`,
          expectedSatellitePostBody
        );
      });
    });
  });

  describe("complex requests using a nested router with queries", () => {
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
          path: "/level1/level2/level3",
          query: { exampleQuery: "value" },
          method: "GET",
          headers: expect.any(Object),
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
      .then((res) => {
        response = res;
      });

    const expectedSatellitePostBody: SatellitePostBody = {
      req: {
        path: examplePath,
        query: {},
        method: "GET",
        headers: expect.any(Object),
      },
      res: { body: undefined },
    };

    expect(response.status).toBe(200);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
