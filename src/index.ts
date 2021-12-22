import { RequestHandler } from "express";

const listener: RequestHandler = (req, res, next) => {
  console.log("NightSky called");
  next();
};

export default listener;
