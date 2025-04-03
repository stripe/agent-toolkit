require("dotenv").config();

import { wrapOpenAI } from "braintrust";
import OpenAI from "openai";
import * as http from "http";
import * as net from "net";

const httpAgent = process.env.SOCKET_PROXY_PATH
  ? new (class extends http.Agent {
      createConnection = (_: any, callback: Function) =>
        net.createConnection(process.env.SOCKET_PROXY_PATH!, () => callback());
    })()
  : undefined;

// This wrap function adds useful tracing in Braintrust
const openai: any = wrapOpenAI(
  new OpenAI({
    baseURL: process.env.OPENAI_BASE_URL,
    apiKey: process.env.OPENAI_API_KEY,
    httpAgent,
  })
);

export default openai;
