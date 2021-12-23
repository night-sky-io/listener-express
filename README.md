# listener-express

NightSky Listeners are lightweight additions to your services that collect request and response data, forwarding it on to NightSky Satellites.

This Listener implementation is an Express middleware. It is suitable for quick-start and production usage but should later be replaced with the NightSky Sidecar Proxy, which allows your application to operate independently, without any direct NightSky integrations.

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
