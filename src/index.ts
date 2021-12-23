import { RequestHandler } from "express";
import axios from "axios";
import { IncomingHttpHeaders } from "http";
import { ParsedQs } from "qs";

export interface ListenerConfig {
  satelliteHost: string;
}

export interface RequestData {
  path: string;
  query: ParsedQs;
  method: string;
  host?: string;
  origin?: string;
}

export interface ResponseData {
  body: any;
}

export interface SatellitePostBody {
  req: RequestData;
  res: ResponseData;
}

const listener =
  ({ satelliteHost }: ListenerConfig): RequestHandler =>
  (req, res, next) => {
    if (
      ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH"].includes(req.method)
    ) {
      const satelliteRequestsUrl = `${satelliteHost}/requests`;
      const requestData: RequestData = {
        method: req.method,
        path: req.baseUrl + req.path,
        query: req.query,
        host: req.headers.host,
        origin: req.headers.origin,
      };

      const originalSend = res.send.bind(res);

      res.send = function (data) {
        if (typeof data === "string") {
          const satellitePostBody: SatellitePostBody = {
            req: requestData,
            res: { body: data },
          };

          axios.post(satelliteRequestsUrl, satellitePostBody);
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
          req: requestData,
          res: { body },
        };

        axios.post(satelliteRequestsUrl, satellitePostBody);

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
    }

    next();
  };

export default listener;
