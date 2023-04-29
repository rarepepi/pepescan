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

    const onNewTransfer = async (
      from: string,
      to: string,
      value: number,
      event: any
    ) => {
      const block = await provider.getBlock(event.blockNumber);
      if (!event.transactionHash) return;
      const newLog = {
        amount: (Number(value) / 10 ** 18).toLocaleString(),
        sender: from,
        recipient: to,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        timestamp: block?.timestamp as number,
      };
      setTransfers((prevTransfers) => [newLog, ...prevTransfers]);
    };

    // Attach the event listener
    pepeContract.on("Transfer", onNewTransfer);

    // Clean up the event listener on component unmount
    return () => {
      pepeContract.off("Transfer", onNewTransfer);
    };
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
        <h1 className="text-4xl font-bold my-4">$PEPE Transfers</h1>
        {pepeTransfers.length > 0 && (
          <div className="relative overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm text-left text-zinc-100">
              <thead>
                <tr className="text-lg">
                  <th className="px-6 py-3">Hash</th>
                  <th className="px-6 py-3">From</th>
                  <th className="px-6 py-3">To</th>
                  <th className="px-6 py-3">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {pepeTransfers.map((transfer) => (
                  <tr key={transfer.transactionHash}>
                    <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                      {transfer.transactionHash.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                      {transfer.sender.slice(0, 8)}...
                      {transfer.sender.slice(36, 42)}
                    </td>
                    <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                      {transfer.recipient.slice(0, 8)}...
                      {transfer.recipient.slice(36, 42)}
                    </td>
                    <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                      {transfer.amount}
                    </td>
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
