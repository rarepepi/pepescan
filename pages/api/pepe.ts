import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  data: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  try {
    const response = await fetch(
      "https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?slug=pepe",
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.COIN_MARKET_CAP_KEY as string,
        },
      }
    );
    const json = await response.json();
    const marketCap = json.data["24478"].self_reported_market_cap;

    const marketCapMillions = marketCap / 1000000; // Calculate how many millions of dollars in market cap
    res.status(200).json({ data: marketCapMillions.toLocaleString() });
  } catch (e) {
    console.log(e);
    res.status(200).json({ data: "error" });
  }
}
