# Nubank API

A high level API to connect to Nubank service and download your purchase records.

This project was created because the API changed over time, and the JavaScript projects weren't updated to communicate to the new version. The [Python library](https://github.com/andreroggeri/pynubank/) is updated by the time of this writing, so I used that as reference to build this library.

## Installation Node.js/Browser

> npm i nubank-api uuid

## Installation React Native

> npm i nubank-api react-native-uuid

## Usage

```typescript
const { NubankApi } = require("nubank-api"); // CommonJS syntax
import { NubankApi } from "nubank-api"; // ES Modules syntax

import { v4 as uuidv4 } from "uuid"; // Browser/Node.js
import { v4 as uuidv4 } from "react-native-uuid"; // ReactNative

import { createInterface } from "readline";
import { writeFile } from "fs/promises";

const CPF: string = "your-cpf";
const PASSWORD: string = "your-password";
const AUTH_CODE: string = uuidv4();

const api = new NubankApi();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  `Generate a QRcode and read with the app: ${AUTH_CODE}`,
  async () => {
    try {
      await api.auth.authenticateWithQrCode(CPF, PASSWORD, AUTH_CODE);
      console.log("You are authenticated!");
      console.log(api.authState);
      await writeFile("./auth-state.json", JSON.stringify(api.authState)); // Saves the auth data to use later
      process.exit(0);
    } catch (e) {
      console.error(e.stack);
    }
  }
);
```

## API

### new NubankApi(params?: NubankApiConstructor)

The constructor takes an object containing the authentication details, which are received after the login operation. This avoids extra requests for login to be executed because it can cause your account to be blocked from logging in for up to 72h in this IP.

<table>
  <tr>
    <th colspan="3" align="left">NubankApiConstructor</th>
  </tr>
  <tr>
    <td><b>Key</b></td>
    <td><b>Type</b></td>
    <td><b>Description</b></td>
  </tr>
  <tr>
    <td>certPath</td>
    <td>string</td>
    <td>(Optional) path to the SSL certificate. Mandatory in case of authentication via p12 certificate.</td>
  </tr>
  <tr>
    <td>privateUrls</td>
    <td>Routes</td>
    <td>(Optional) private routes received after authentication.</td>
  </tr>
  <tr>
    <td>publicUrls</td>
    <td>Record<string, string></td>
    <td>(Optional) public routes received after authentication.</td>
  </tr>
</table>

### Class properties

All the operations available are methods nested within the object properties.

<table>
  <tr>
    <th colspan="3" align="left">NubankApiConstructor</th>
  </tr>
  <tr>
    <td><b>Property</b></td>
    <td><b>Description</b></td>
  </tr>
  <tr>
    <td>[auth](./src/auth.ts)</td>
    <td>Authentication operations</td>
  </tr>
  <tr>
    <td>[account](./src/account.ts)</td>
    <td>Contains methods to access the user account details and the checking account transactions and bills</td>
  </tr>
  <tr>
    <td>[card](./src/card.ts</td>
    <td>Contains methods to retrieve the feed of transactions from the credit card</td>
  </tr>
  <tr>
    <td>[payment](./src/payment.ts)</td>
    <td>Contains methods to create payment requests</td>
  </tr>
  <tr>
    <td>[http](./src/utils/http.ts)</td>
    <td>Wrapper for the API access used by the other modules. Don't use it unless you need to make custom requests not supported by this lib.</td>
  </tr>
</table>

## LICENSE

[GNU GPL v3](./LICENSE)
