import { VercelRequest, VercelResponse } from "@vercel/node/dist/index";
import { version } from "../package.json";

export default (req: VercelRequest, res: VercelResponse): void => {
  res.json({ version });
};
