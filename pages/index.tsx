import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>PepeScan</title>
        <meta name="description" content="T2" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>
        <div className="text-3xl font-bold">
          <h1>$PEPE</h1>
        </div>
      </main>
    </>
  );
}
