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
  const [filterInput, setFilter] = useState({ sender: "", recipient: "" });
  const [pepeInMillions, setPepeInMillions] = useState<number>(0);
  const [currentTimestamp, setCurrentTimestamp] = useState(
    Math.floor(Date.now() / 1000)
  );

  async function getLast100Transfers(sender: string, recipient: string) {
    const filter = pepeContract.filters.Transfer(
      filterInput.sender || null,
      filterInput.recipient || null
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
      } as Transfer;
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
    const intervalId = setInterval(() => {
      getPepeInMillions();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const getTransfers = async () => {
    console.log("getting transfers...");
    const transfers = await getLast100Transfers(
      filterInput.sender,
      filterInput.recipient
    );
    setTransfers(transfers.reverse());
  };

  const getPepeInMillions = async () => {
    const pepeResponse = await fetch("/api/pepe");
    const pepeInMillions = (await pepeResponse.json()).data;
    setPepeInMillions(pepeInMillions);
  };

  const onNewTransfer = async (
    from: string,
    to: string,
    value: number,
    event: any
  ) => {
    const block = await provider.getBlock(event.blockNumber);
    if (!event.transactionHash) return;
    console.log("new transfer!");
    const newLog = {
      amount: (Number(value) / 10 ** 18).toLocaleString(),
      sender: from,
      recipient: to,
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: block?.timestamp as number,
      ageInSeconds: currentTimestamp - (block?.timestamp as number),
    } as Transfer;
    console.log({ newLog });
    console.log({ pepeTransfers });
    setTransfers([...pepeTransfers, newLog]);
  };

  useEffect(() => {
    getTransfers();
    getPepeInMillions();
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

  const sortTransactions = () => {
    console.log("sorting by sender/reciever...");
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;

    // If sender or recipient is not a valid eth address, return
    if (
      filterInput.sender !== "" &&
      !ethAddressRegex.test(filterInput.sender)
    ) {
      console.log("invalid sender eth address");
      return;
    }
    if (
      filterInput.recipient !== "" &&
      !ethAddressRegex.test(filterInput.recipient)
    ) {
      console.log("invalid recipient eth address");
      return;
    }

    console.log("filtering transfers...");
    const filteredLogs = pepeTransfers.filter((transfer) => {
      return (
        transfer.sender.includes(filterInput.sender) ||
        transfer.recipient.includes(filterInput.recipient)
      );
    });
    setTransfers(filteredLogs);
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
        <h2 className="text-xl mb-4">
          Market Cap{" "}
          <span className="text-2xl font-bold">{pepeInMillions}</span> Million
        </h2>
        <div className="flex justify-center space-x-2 mb-4">
          <input
            type="text"
            className="bg-transparent text-white focus:outline-none text-center border rounded-2xl"
            placeholder="Sender"
            name="sender"
            value={filterInput.sender}
            onChange={(e) => {
              setFilter({
                sender: e.target.value,
                recipient: filterInput.recipient,
              });
              sortTransactions();
            }}
          />
          <input
            type="text"
            className="bg-transparent text-white focus:outline-none text-center border rounded-2xl"
            placeholder="Recipient"
            name="recipient"
            value={filterInput.recipient}
            onChange={(e) => {
              setFilter({
                recipient: e.target.value,
                sender: filterInput.sender,
              });
              sortTransactions();
            }}
          />
        </div>

        {pepeTransfers.length > 0 && (
          <div className="max-w-full relative overflow-x-auto border rounded-2xl">
            <table className="max-w-full text-sm text-left text-zinc-100">
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
                          🔗 {transfer.transactionHash.slice(0, 12)}...
                        </a>
                      </td>
                      <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                        {age}
                      </td>
                      <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                        ⬇️ {transfer.sender.slice(0, 8)}...
                        {transfer.sender.slice(36, 42)}
                      </td>
                      <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                        ⬆️ {transfer.recipient.slice(0, 8)}...
                        {transfer.recipient.slice(36, 42)}
                      </td>
                      <td className="px-6 py-4 font-medium  whitespace-nowrap ">
                        🐸 {transfer.amount}
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
