# $PEPE Token Transfer Tracker

## Description

The $PEPE Token Transfer Tracker is a Next.js(React.js) web app that displays the most recent 100 transfers of the $PEPE token on the Ethereum blockchain. The app provides users with the ability to filter transfers by sender and recipient addresses, as well as sort the transfer list by timestamp and transfer value. This application offers a user-friendly interface for monitoring $PEPE token transfers and obtaining essential information, such as transaction hashes, sender and recipient addresses, and transfer amounts.

## Technologies and Implementation

1. **Next.js**: The application is built using Next.js, a popular React framework that provides features such as server-rendering, static site generation, and API routes. Next.js is utilized for its ease of use, scalability, and performance optimizations.

2. **ethers.js**: The app uses ethers.js, a lightweight and modular Ethereum library for interacting with the Ethereum blockchain. ethers.js allows the application to connect to the Ethereum network, query the smart contract for $PEPE token transfers, and parse the event logs.

3. **Alchemy Provider**: Alchemy is an Ethereum infrastructure provider that offers reliable and scalable access to the Ethereum network. The app uses Alchemy to establish a connection with the Ethereum network through the ethers.js library.

4. **React Hooks**: The app leverages React hooks, such as useState and useEffect, to manage component state and side effects. This approach results in cleaner, more modular code that is easier to maintain and test.

## High-Level Decisions

1. **Filtering and sorting**: The app provides users with the ability to filter by sender and recipient addresses and sort by timestamp and transfer value to offer a more tailored experience. These features help users quickly find relevant information and gain insight into $PEPE token transfer activity.

2. **Real-time updates**: The application uses event listeners to update the transfer list in real-time whenever a new transfer occurs. This functionality ensures that users always have access to the latest information without needing to refresh the page manually.

3. **Responsive design**: The app is built using a responsive design, ensuring that it looks good and functions well on different devices and screen sizes. This design approach makes the app more accessible to a broader range of users.

4. **Scalability and maintainability**: By using TypeScript and Tailwind CSS, the app benefits from strong typing and a utility-first CSS framework, resulting in better code organization and maintainability. These technologies also enable easier debugging and scalability, allowing the app to grow and adapt to future requirements with minimal friction.
