import { RequestHandler } from "express";
import axios from "axios";

export interface ListenerConfig {
  satellite: string;
}

const listener =
  ({ satellite }: ListenerConfig): RequestHandler =>
  (req, res, next) => {
    const originalSend = res.send.bind(res);

    res.send = function (responseBody) {
      if (typeof responseBody === "string") {
        axios.post(satellite, {
          req: { path: req.path },
          res: { body: responseBody },
        });
      }

      return originalSend(responseBody);
    };

    next();
  };

export default listener;
