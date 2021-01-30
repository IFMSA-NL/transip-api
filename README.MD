# TransIP API for Node

This library intends to be an easy wrapper for the full TransIP API, as well as the Authentication class, originally implemented in PHP.
The currently supported version is v6.6.

The documentation for the API itself can be found at [api.transip.nl](https://api.transip.nl/rest/docs.html).

> This library is not supported by or affilated with TransIP in any way

## Usage

```js
const TransIP = require("transip");

const api = new TransIP();
```

### General Structure

The structure of the [API docs provided by TransIP](https://api.transip.nl/rest/docs.html) is replicated as much as possible. This results in the following:

- The API docs list `Domains` > `Branding` > `Get domain branding`, so the call would be `api.domains.branding.get()`;
- The API docs list `HA-IP` > `HA-IP Certificates` > `Detach a certificate from this HA-IP`, so the call would be `api.haip.certificates.detach()`;

There are a few exceptions:

- `General` is split up: `products.list()`, `products.get()`, `availabilityZones.list()`, `test()`.
- `Domains` > `Domains` > _ is shortened to `api.domains._()`;
- `VPS` > `VPS` > _ is shortened to `api.vps._()`;
- The same for `HA-IP` (`haip.*()`);
- and`Colocations` (`colocations.*()`);

### Request structure

The TransIP API guide can be used, when keeping the following in mind:

- Names with hyphens (`some-name`) are converted to camelCase (`someName`);
- Uppercase is made lowercase, except in context of camelCase strings;

Requests are made as follows:

```js
api.jediMasters.get("kenobi");
// This call might result in:
// https://{api_url}/jedi-masters/kenobi
```

When the API docs require a request body:

```js
api.jediMasters.sayTo("kenobi", "grievous", { firstLine: "Hello there!" });
// Might result in:
// https://{api_url}/jedi-masters/say/kenobi/to/grievous
// With request body: { "firstLine": "Hello there!" }
```

Requests that allow search parameters in the URL will expect them as a comma seperated string:

```js
api.characters.list("sith,jedi");
// Might result in:
// https://{api_url}/characters?tags=sith,jedi
```

### Billing protection

This library tries to prevent accidental creation of invoices. In addition to test mode below, requests that result in billing are turned off by default.

To enable the 'dangerous' requests that might result in additional costs:

```js
const api = new TransIP({ allowBilling: true });
// OR
api.allowBilling(true);
```

This is only enabled on fields listed in the API docs as creating invoices, so please note while cancelling might change your invoice as well, these will not be blocked when `allowBilling` is false.

Installing an OS on a VPS will be blocked, although this will be free most of the time. This is because this wrapper doesn't know which OS requires a license.

### Test mode

This library implements the `test mode` as described in the TransIP API docs, by adding `?test=1` to a URL when test mode is on.

Test mode is off by default and can be turned on with the `.testMode()` method:

```js
const api = new TransIP({ testMode: true });
// OR
api.testMode(true);
```

Another way to test, although not with your own data, is using the demo account provided by TransIP. The access token to this account can be provided instead of the normal auth options:

```js
const DEMO_TOKEN =
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImN3MiFSbDU2eDNoUnkjelM4YmdOIn0.eyJpc3MiOiJhcGkudHJhbnNpcC5ubCIsImF1ZCI6ImFwaS50cmFuc2lwLm5sIiwianRpIjoiY3cyIVJsNTZ4M2hSeSN6UzhiZ04iLCJpYXQiOjE1ODIyMDE1NTAsIm5iZiI6MTU4MjIwMTU1MCwiZXhwIjoyMTE4NzQ1NTUwLCJjaWQiOiI2MDQ0OSIsInJvIjpmYWxzZSwiZ2siOmZhbHNlLCJrdiI6dHJ1ZX0.fYBWV4O5WPXxGuWG-vcrFWqmRHBm9yp0PHiYh_oAWxWxCaZX2Rf6WJfc13AxEeZ67-lY0TA2kSaOCp0PggBb_MGj73t4cH8gdwDJzANVxkiPL1Saqiw2NgZ3IHASJnisUWNnZp8HnrhLLe5ficvb1D9WOUOItmFC2ZgfGObNhlL2y-AMNLT4X7oNgrNTGm-mespo0jD_qH9dK5_evSzS3K8o03gu6p19jxfsnIh8TIVRvNdluYC2wo4qDl5EW5BEZ8OSuJ121ncOT1oRpzXB0cVZ9e5_UVAEr9X3f26_Eomg52-PjrgcRJ_jPIUYbrlo06KjjX2h0fzMr21ZE023Gw";

api.auth(DEMO_TOKEN);
```

Please refer to the [current documentation](https://api.transip.nl/rest/docs.html#header-demo-token) for the correct token.

### Pagination

The TransIP API supports pagination, but this wrapper does not implement this by itself. As the responses (including pagination-URLs) are returned as-is, however, you could fetch them yourself with the `.query()` method.

```js
await api.query("https://api.transip.nl/v6/domains?page=1&pageSize=0");
```

## API

A "request body"-object must always be the last parameter of a method. For contents of the request body, [see the API docs](ttps://api.transip.nl/rest/docs.html).

> WIP!

### `availabilityZones`

| method   | parameters | request body |
| -------- | ---------- | ------------ |
| `list()` |            |              |

### `products`

| method   | parameters  | request body |
| -------- | ----------- | ------------ |
| `list()` | tags        |              |
| `get()`  | productName |              |

### `domains`

| method       | parameters | request body                                                |
| ------------ | ---------- | ----------------------------------------------------------- |
| `list()`     | tags       |                                                             |
| `get()`      | domainName |                                                             |
| `register()` |            | { domainName, contacts, nameservers, dnsEntries }           |
| `transfer()` |            | { authCode, domainName, contacts, nameservers, dnsEntries } |
| `update()`   | domainName | { domain }                                                  |
| `cancel()`   | domainName | { endTime }                                                 |

### `domains.branding`

| method     | parameters | request body |
| ---------- | ---------- | ------------ |
| `get()`    | domainName |              |
| `update()` | domainName | { domain }   |

### `domains.contacts`

| method     | parameters | request body |
| ---------- | ---------- | ------------ |
| `get()`    | domainName |              |
| `update()` | domainName | { contacts } |

### `domains.dns`

| method        | parameters | request body   |
| ------------- | ---------- | -------------- |
| `list()`      | domainName |                |
| `add()`       | domainName | { dnsEntry }   |
| `update()`    | domainName | { dnsEntry }   |
| `updateAll()` | domainName | { dnsEntries } |
| `delete()`    | domainName | { dnsEntry }   |

### `domains.dnsSec`

| method     | parameters | request body      |
| ---------- | ---------- | ----------------- |
| `list()`   | domainName |                   |
| `update()` | domainName | { dnsSecEntries } |

### `domains.nameservers`

| method     | parameters | request body    |
| ---------- | ---------- | --------------- |
| `list()`   | domainName |                 |
| `update()` | domainName | { nameservers } |

### `domains.actions`

| method     | parameters | request body                                    |
| ---------- | ---------- | ----------------------------------------------- |
| `get()`    | domainName |                                                 |
| `retry()`  | domainName | { authCode, dnsEntries, nameservers, contacts } |
| `cancel()` | domainName | { nameservers }                                 |

## Dependencies

The only external dependency is `node-fetch`. The `crypto` class, native to node, is used as well.
