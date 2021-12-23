# listener-express

NightSky Listeners are lightweight additions to your server-side applications that collect request and response data, forwarding it on to NightSky Satellites.

This Listener implementation is an Express middleware.

It is suitable for quick-start and, if necessary, production usage. However, we recommend using the NightSky Sidecar Proxy Listener where possible for enhanced performance and separation of concerns.

## Installation

```bash
npm install --save @night-sky/listener-express
```

## Usage

```js
import express from "express";
import nightskyListener from "@night-sky/listener-express";

const app = express();

app.use(
  nightskyListener({ satelliteHost: "example-satellite.svc.cluster.local" })
);

app.get("/", (req, res) => {
  res.send({ success: true });
});

app.listen(3000);
```
