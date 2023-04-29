import Head from "next/head";
import { ethers } from "ethers";
import { pepeAbi } from "@/data/abi";
import { useEffect, useState } from "react";

const provider = new ethers.AlchemyProvider(
  "homestead",
  process.env.NEXT_PUBLIC_ALCHEMY_KEY
);
const pepeContractAddress = "0x6982508145454Ce325dDbE47a25d4ec3d2311933";
const pepeContract = new ethers.Contract(
  pepeContractAddress,
  pepeAbi,
  provider
);

type Transfer = {
  amount: string;
  sender: string;
  recipient: string;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
};

export default function Home() {
  const [pepeTransfers, setTransfers] = useState<Transfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [senderFilter, setSenderFilter] = useState("");
  const [recipientFilter, setRecipientFilter] = useState("");
  const [sortBy, setSortBy] = useState("timestamp");

  async function getLast100Transfers() {
    const filter = pepeContract.filters.Transfer();
    const eventLogs = await pepeContract.queryFilter(filter, -100);

    const parsedLogs = eventLogs.map(async (eventLog) => {
      const parsedLog = pepeContract.interface.parseLog({
        topics: eventLog.topics as string[],
        data: eventLog.data,
      });
      const amount = Number(parsedLog?.args.value) / 10 ** 18;
      const sender = parsedLog?.args.from;
      const recipient = parsedLog?.args.to;
      const block = await provider.getBlock(eventLog.blockNumber);
      const timestamp = block?.timestamp;
      return {
        amount: amount.toLocaleString(),
        sender,
        recipient,
        transactionHash: eventLog.transactionHash,
        blockNumber: eventLog.blockNumber,
        timestamp: timestamp as number,
      };
    });
    const resolvedLogs = await Promise.all(parsedLogs);
    return resolvedLogs;
  }

  useEffect(() => {
    const getTransfers = async () => {
      console.log("getting transfers...");
      const transfers = await getLast100Transfers();
      setTransfers(transfers);
    };
    getTransfers();
  }, []);

  return (
    <>
      <Head>
        <title>PepeScan</title>
        <meta name="description" content="PepeScan" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="text-zinc-50 flex flex-col items-center">
        <h1 className="text-3xl font-bold mt-4">$PEPE</h1>
        {pepeTransfers.length > 0 && (
          <div className="max-w-2xl flex justify-center">
            <table className="table-auto">
              <thead>
                <tr>
                  <th>Transaction Hash</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {pepeTransfers.map((transfer) => (
                  <tr key={transfer.transactionHash}>
                    <td>{transfer.transactionHash.slice(0, 16)}</td>
                    <td>{transfer.sender.slice(0, 16)}</td>
                    <td>{transfer.recipient.slice(0, 16)}</td>
                    <td>{transfer.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
