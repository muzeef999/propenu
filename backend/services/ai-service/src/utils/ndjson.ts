import { Response  } from "express";

export function sendNDJSON(
  res:Response ,
  data:Record<string, any>
) {

  res.write(
    JSON.stringify(data) + "\n"
  );
}