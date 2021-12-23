import { RequestHandler } from "express";
import axios from "axios";

export interface ListenerConfig {
  satelliteHost: string;
}

export interface SatellitePostBody {
  req: {
    path: string;
  };
  res: {
    body: any;
  };
}

const listener =
  ({ satelliteHost }: ListenerConfig): RequestHandler =>
  (req, res, next) => {
    const originalSend = res.send.bind(res);
    res.send = function (data) {
      if (typeof data === "string") {
        const satellitePostBody: SatellitePostBody = {
          req: { path: req.path },
          res: { body: data },
        };

        axios.post(
          `${satelliteHost}/requests/${req.method}`,
          satellitePostBody
        );
      }

      return originalSend.apply(this, arguments as unknown as [body?: any]);
    };

    const originalEnd = res.end.bind(res);

    res.end = function (arg1?: Function | any) {
      let body: any;
      if (typeof arg1 !== "function") {
        body = arg1;
      }

      const satellitePostBody: SatellitePostBody = {
        req: { path: req.path },
        res: { body },
      };

      axios.post(`${satelliteHost}/requests/${req.method}`, satellitePostBody);

      return originalEnd.apply(
        this,
        arguments as unknown as [
          chunk: any,
          encoding: BufferEncoding,
          cb?: (() => void) | undefined
        ]
      );
    };

    // TODO JMB: Add handler for res.redirect()

    next();
  };

export default listener;
