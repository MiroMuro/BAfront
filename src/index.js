import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { setContext } from "@apollo/client/link/context";
import {
  ApolloClient,
  ApolloProvider,
  InMemoryCache,
  createHttpLink,
  split,
} from "@apollo/client";
import { getMainDefinition } from "@apollo/client/utilities";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import "./index.css";

//Set the authorization token to the request headers
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("library-user-token");
  return {
    headers: {
      ...headers,
      authorization: token ? `bearer ${token}` : null,
    },
  };
});

//Create the http link for connecting to backend server, in this case, an apollo server.
const httpLink = createHttpLink({
  uri: "https://baback.onrender.com/",
});
// Create a WebSocket link for subscriptions to the apollo server.
const wsLink = new GraphQLWsLink(
  createClient({
    url: "wss://baback.onrender.com/",
  })
);
console.log("wsLink", wsLink);
console.log("httpLink", httpLink);
const splitLink = split(
  // * A function that's called for each operation to execute
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  // * The Link to use for an operation if the function returns a "truthy" value. (eg. subscription)
  wsLink,
  // * The Link to use for an operation if the function returns a "falsy" value. (eg. query or mutation)
  authLink.concat(httpLink)
);

const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
