import { RequestHandler } from "express";
import axios from "axios";
import { ParsedQs } from "qs";

export interface ListenerConfig {
  satelliteHost: string;
}

export interface RequestData {
  method: string;
  path: string;
  query: ParsedQs;
  body?: any;
  host?: string;
  origin?: string;
}

export interface ResponseData {
  body: any;
}

export interface SatellitePostBody {
  request: RequestData;
  response: ResponseData;
}

const listener =
  ({ satelliteHost }: ListenerConfig): RequestHandler =>
  (req, res, next) => {
    if (
      ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"].includes(req.method)
    ) {
      const originalSend = res.send.bind(res);

      res.send = function (data) {
        if (typeof data === "string") {
          const satellitePostBody: SatellitePostBody = {
            request: {
              method: req.method,
              path: req.baseUrl + req.path,
              query: req.query,
              body: req.body,
              host: req.headers.host,
              origin: req.headers.origin,
            },
            response: { body: data },
          };

          axios.post(`${satelliteHost}/requests`, satellitePostBody);
        }

        return originalSend.apply(this, arguments as unknown as [body?: any]);
      };

      // TODO JMB: Add handler for res.redirect()
    }

    next();
  };

export default listener;
