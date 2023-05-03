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
  ageInSeconds: number;
};

export default function Home() {
  const [pepeTransfers, setTransfers] = useState<Transfer[]>([]);
  const [sortedAsc, setSortedAsc] = useState<boolean>(false);
  const [filter, setFilter] = useState({ sender: "", recipient: "" });
  const [currentTimestamp, setCurrentTimestamp] = useState(
    Math.floor(Date.now() / 1000)
  );

  async function getLast100Transfers(sender: string, recipient: string) {
    const filter = pepeContract.filters.Transfer(
      sender || null,
      recipient || null
    );
    const eventLogs = await pepeContract.queryFilter(filter, -100);

    const parsedLogs = eventLogs.map(async (eventLog) => {
      const parsedLog = pepeContract.interface.parseLog({
        topics: eventLog.topics as string[],
        data: eventLog.data,
      });
      const block = await provider.getBlock(eventLog.blockNumber);

      return {
        amount: (Number(parsedLog?.args.value) / 10 ** 18).toLocaleString(),
        sender: parsedLog?.args.from,
        recipient: parsedLog?.args.to,
        transactionHash: eventLog.transactionHash,
        blockNumber: eventLog.blockNumber,
        timestamp: block?.timestamp as number,
        ageInSeconds: currentTimestamp - (block?.timestamp as number),
      };
    });
    const resolvedLogs = await Promise.all(parsedLogs);
    return resolvedLogs;
  }
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    const getTransfers = async () => {
      console.log("getting transfers...");
      const transfers = await getLast100Transfers(
        filter.sender,
        filter.recipient
      );
      setTransfers(transfers.reverse());
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
        ageInSeconds: currentTimestamp - (block?.timestamp as number),
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

  const sortByAmount = () => {
    console.log("sorting by amount...");

    const sortedLogs = pepeTransfers.sort((a: Transfer, b: Transfer) => {
      const aAmount = parseFloat(a.amount.replace(/,/g, ""));
      const bAmount = parseFloat(b.amount.replace(/,/g, ""));
      if (sortedAsc) {
        return aAmount - bAmount;
      } else {
        return bAmount - aAmount;
      }
    });
    setSortedAsc(!sortedAsc);
    setTransfers(sortedLogs);
  };

  const sortByAge = () => {
    console.log("sorting by amount...");

    const sortedLogs = pepeTransfers.sort((a: Transfer, b: Transfer) => {
      if (sortedAsc) {
        return a.ageInSeconds - b.ageInSeconds;
      } else {
        return b.ageInSeconds - a.ageInSeconds;
      }
    });
    setSortedAsc(!sortedAsc);
    setTransfers(sortedLogs);
  };

  function formatAge(seconds: number) {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days === 1 ? "" : "s"} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    } else {
      return `${seconds} second${seconds === 1 ? "" : "s"} ago`;
    }
  }

  return (
    <>
      <Head>
        <title>PepeScan</title>
        <meta name="description" content="PepeScan" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="text-zinc-50 flex flex-col items-center">
        <img src="/images/pepe.webp" height={200} width={200} />
        <h1 className="text-4xl font-bold my-4">$PEPE Transfers</h1>
        {pepeTransfers.length > 0 && (
          <div className="w-full relative overflow-x-auto border rounded-2xl">
            <table className="w-full text-sm text-left text-zinc-100">
              <thead>
                <tr className="text-lg">
                  <th className="px-6 py-3">Hash</th>
                  <th
                    className="px-6 py-3 hover:cursor-pointer"
                    onClick={() => sortByAge()}
                  >
                    Age
                  </th>
                  <th className="px-6 py-3">From</th>
                  <th className="px-6 py-3">To</th>
                  <th
                    className="px-6 py-3 hover:cursor-pointer"
                    onClick={() => sortByAmount()}
                  >
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {pepeTransfers.map((transfer, i) => {
                  const age = formatAge(currentTimestamp - transfer.timestamp);

                  return (
                    <tr key={i}>
                      <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href={`https://etherscan.io/tx/${transfer.transactionHash}`}
                        >
                          {transfer.transactionHash.slice(0, 12)}...
                        </a>
                      </td>
                      <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                        {age}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
