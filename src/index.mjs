import createToken from "./auth.mjs";

function removeEmptyFromObj(obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, v]) => v != null)
      .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
  );
}

class TransIP {
  #auth;
  #allowBilling;
  #testMode;
  #BASE_URL = "https://api.transip.nl/v6";
  constructor(options) {
    const defaultOptions = { allowBilling: false, testMode: false };
    options = { ...defaultOptions, ...options };
    this.#allowBilling = options.allowBilling;
    this.#testMode = options.testMode;
  }

  async auth(options, key) {
    if (options && typeof options === "string") {
      this.#auth = options;
    } else {
      this.#auth = await createToken(options, key);
    }
    return this.#auth;
  }

  allowBilling(allow) {
    this.#allowBilling = !!allow;
  }

  testMode(bool) {
    this.#testMode = !!bool;
  }

  async #req(route, method = "GET", options = {}) {
    const defaultValues = {
      billing: false,
      params: {},
      headers: null,
      body: null,
    };
    const { billing, params, headers, body } = { ...defaultValues, ...options };
    if (billing && !this.#allowBilling) {
      throw new Error(
        "The action you requested would change your invoice. 'allowBilling' must be enabled to do so."
      );
    }
    if (this.#testMode) {
      params.test = 1;
    }
    const defaultHeaders = this.#auth
      ? {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.#auth}`,
        }
      : {};
    const URL = `${this.#BASE_URL}/${route}${
      params ? this.#createSearchParams(params) : ""
    }`;
    const parsedBody = body ? JSON.stringify(removeEmptyFromObj(body)) : null;
    const response = await fetch(URL, {
      method: method,
      headers: { ...defaultHeaders, ...headers },
      body: parsedBody,
    });
    return await response.json();
  }

  get token() {
    return this.#auth;
  }

  async query(URL) {
    let parsed = URL;
    if (URL.includes(this.#BASE_URL)) {
      parsed = URL.slice(this.#BASE_URL.length + 1);
    }
    return await req(parsed);
  }

  #createSearchParams(params) {
    let result = "?";
    let i = 0;
    for (const key in params) {
      if (Object.hasOwnProperty.call(params, key)) {
        result += `${i > 0 ? "&" : ""}${key}=${obkect[key]}`;
        i++;
      }
    }
    return result;
  }

  products = {
    list: async () => await this.#req("products"),
    get: async (productName) =>
      await this.#req(`products/${productName}/elements`),
  };

  availabilityZones = {
    list: async () => await this.#req("availability-zones"),
  };

  async test() {
    return await this.#req("api-test");
  }

  // Domains
  domains = {
    list: async (tags = null) =>
      await this.#req("domains", "GET", { params: { tags } }),
    get: async (domainName) => await this.#req(`domains/${domainName}`),
    register: async ({ domainName, contacts, namesevers, dnsEntries }) =>
      await this.#req("domains", "POST", {
        billing: true,
        body: { domainName, contacts, namesevers, dnsEntries },
      }),
    transfer: async ({
      domainName,
      authCode,
      contacts,
      nameservers,
      dnsEntries,
    }) =>
      await req("domains", "POST", {
        billing: true,
        body: { domainName, authCode, contacts, nameservers, dnsEntries },
      }),
    update: async (domainName, { domain }) =>
      await this.#req(`domains/${domainName}`, "PUT", { body: { domain } }),
    cancel: async (domainName, { endTime = "end" }) =>
      await this.#req(`domains/${domainName}`, "DELETE", { body: { endTime } }),
    branding: {
      get: async (domainName) =>
        await this.#req(`domains/${domainName}/branding`),
      update: async (domainName, { branding }) =>
        this.#req(`domains/${domainName}/branding`, "PUT", {
          body: { branding },
        }),
    },
    contacts: {
      list: async (domainName) =>
        await this.#req(`domains/${domainName}/contacts`),
      update: async (domainName, { contacts }) =>
        await this.#req(`domains/${domainName}/contacts`, "PUT", {
          body: { contacts },
        }),
    },
    dns: {
      list: async (domainName) => await this.#req(`domains/${domainName}/dns`),
      add: async (domainName, { dnsEntry }) =>
        await this.#req(`domains/${domainName}/dns`, "POST", {
          body: { dnsEntry },
        }),
      update: async (domainName, { dnsEntry }) =>
        await this.#req(`domains/${domainName}/dns`, "PATCH", {
          body: { dnsEntry },
        }),
      updateAll: async (domainName, { dnsEntries }) =>
        await this.#req(`domains/${domainName}/dns`, "PUT", {
          body: { dnsEntries },
        }),
      delete: async (domainName, { dnsEntry }) =>
        await this.#req(`domains/${domainName}/dns`, "DELETE", {
          body: { dnsEntry },
        }),
    },
    dnsSec: {
      list: async (domainName) =>
        await this.#req(`domains/${domainName}/dnssec`),
      update: async (domainName, { dnsSecEntries }) =>
        await this.#req(`domains/${domainName}/dnssec`, "PUT", {
          body: dnsSecEntries,
        }),
    },
    nameservers: {
      list: async (domainName) =>
        await this.#req(`domains/${domainName}/nameservers`),
      update: async (domainName, { nameservers }) =>
        await this.#req(`domains/${domainName}/nameservers`, "PUT", {
          body: { nameservers },
        }),
    },
    actions: {
      get: async (domainName) =>
        await this.#req(`domains/${domainName}/actions`),
      retry: async (
        domainName,
        {
          authCode = null,
          dnsEntries = null,
          nameservers = null,
          contacts = null,
        }
      ) =>
        await this.#req(`domains/${domainName}/actions`, "PATCH", {
          authCode,
          dnsEntries,
          nameservers,
          contacts,
        }),
      cancel: async (domainName) =>
        await this.#req(`domains/${domainName}/actions`, "DELETE"),
    },
    ssl: {
      list: async (domainName) => await this.#req(`domains/${domainName}/ssl`),
      get: async (domainName, certificateId) =>
        `domains/${domainName}/ssl/${certificateId}`,
    },
    whois: {
      get: async (domainName) => await this.#req(`domains/${domainName}/whois`),
    },
    whitelabel: {
      order: async () =>
        await this.#req(`whitelabel`, "POST", { billing: true }),
    },
    domainAvailability: {
      get: async (domainName) =>
        await this.#req(`domain-availability/${domainName}`),
      list: async ({ domainNames }) =>
        await this.#req(`domain-availability/${domainName}`, "GET", {
          body: { domainNames },
        }),
    },
    tlds: {
      list: async () => await this.#req(`tlds`),
      get: async (tld) => await this.#req(`tlds/${tld}`),
    },
  };

  // VPS
  vps = {
    list: async (tags) => await this.#req("vps", "GET", { params: { tags } }),
    get: async (vpsName) => await this.#req(`vps/${vpsName}`),
    order: async ({
      productName,
      addons = null,
      availabilityZone = null,
      description = null,
      operatingSystem,
      installFlavour = null,
      hostname = null,
      username = null,
      sshKeys = null,
      base64InstallText = null,
    }) =>
      await this.#req("vps", "POST", {
        billing: true,
        body: {
          productName,
          addons,
          availabilityZone,
          description,
          operatingSystem,
          installFlavour,
          hostname,
          username,
          sshKeys,
          base64InstallText,
        },
      }),
    orderMultiple: async ({ vpss }) =>
      await this.#req("vps", "POST", { billing: true, body: { vpss } }),
    clone: async ({ vpsName, availabilityZone }) =>
      await this.#req("vps", "POST", {
        billing: true,
        body: { vpsName, availabilityZone },
      }),
    update: async (vpsName, { vps }) =>
      await this.#req(`vps/${vpsName}`, "PUT", { body: { vps } }),
    start: async (vpsName) =>
      await this.#req(`vps/${vpsName}`, "PATCH", { body: { action: "start" } }),
    stop: async (vpsName) =>
      await this.#req(`vps/${vpsName}`, "PATCH", { body: { action: "stop" } }),
    reset: async (vpsName) =>
      await this.#req(`vps/${vpsName}`, "PATCH", { body: { action: "reset" } }),
    handover: async (vpsName, { targetCustomerName }) =>
      await this.#req(`vps/${vpsName}`, "PATCH", {
        body: { action: "handover", targetCustomerName },
      }),
    cancel: async (vpsName, { endTime = "end" }) =>
      await this.#req(`vps/${vpsName}`, "DELETE", { body: { endTime } }),
    usage: async (
      vpsName,
      { types = null, dateTimeStart = null, dateTimeEnd = null }
    ) =>
      await this.#req(`vps/${vpsName}/usage`, "GET", {
        body: { types, dateTimeStart, dateTimeEnd },
      }),
    vnc: {
      get: async (vpsName) => await this.#req(`vps/${vpsName}/vnc-data`),
      regenerateToken: async (vpsName) =>
        await this.#req(`vps/${vpsName}/vnc-data`, "PATCH"),
    },
    addons: {
      list: async (vpsName) => await this.#req(`vps/${vpsName}/addons`),
      order: async (vpsName, { addons }) =>
        await this.#req(`vps/${vpsName}/addons`, "POST", {
          billing: true,
          body: { addons },
        }),
      cancel: async (vpsName, addonName) =>
        await this.#req(`vps/${vpsName}/addons/${addonName}`, "DELETE"),
    },
    licenses: {
      list: async (vpsName) => await this.#req(`vps/${vpsName}/licenses`),
      order: async (vpsName, { licenseName, quantity }) =>
        await this.#req(`vps/${vpsName}/licenses`, "POST", {
          billing: true,
          body: { licenseName, quantity },
        }),
      update: async (vpsName, licenseId) =>
        await this.#req(`vps/${vpsName}/licenses/${licenseId}`, "PUT", {
          billing: true,
          body: { newLicenseName },
        }),
      cancel: async (vpsName, licenseId) =>
        await this.#req(`vps/${vpsName}/licenses/${licenseId}`),
    },
    upgrades: {
      list: async (vpsName) => await this.#req(`vps/${vpsName}/upgrades`),
      order: async (vpsName, { productName }) =>
        await this.#req(`vps/${vpsName}/upgrades`, "POST", {
          billing: true,
          body: { productName },
        }),
    },
    os: {
      list: async (vpsName) =>
        await this.#req(`vps/${vpsName}/operating-systems`),
      install: async (
        vpsName,
        {
          operatingSystemName,
          hostname = null,
          installFlavour = null,
          username = null,
          sshKeys = null,
          base64InstallText = null,
        }
      ) =>
        await this.#req(`vps/${vpsName}/operating-systems`, "POST", {
          billing: true,
          body: {
            operatingSystemName,
            hostname,
            installFlavour,
            username,
            sshKeys,
            base64InstallText,
          },
        }),
    },
    ip: {
      list: async (vpsName) => await this.#req(`vps/${vpsName}/ip-addresses`),
      get: async (vpsName, ipAddress) =>
        await this.#req(`vps/${vpsName}/ip-addresses/${ipAddress}`),
      add: async (vpsName, { ipAddress }) =>
        await this.#req(`vps/${vpsName}/ip-addresses`, "POST", {
          body: { ipAddress },
        }),
      updateReverseDns: async (vpsName, ipAddress, { ipAddressOptions }) =>
        await this.#req(`vps/${vpsName}/ip-addresses/${ipAddress}`, "PUT", {
          body: { ipAddress: ipAddressOptions },
        }),
      delete: async (vpsName, ipAddress) =>
        await this.#req(`vps/${vpsName}/ip-addresses/${ipAddress}`),
    },
    snapshots: {
      list: async (vpsName) => await this.#req(`vps/${vpsName}/snapshots`),
      get: async (vpsName, snapshotName) =>
        await this.#req(`vps/${vpsName}/snapshots/${snapshotName}`),
      create: async (vpsName) =>
        await this.#req(`vps/${vpsName}/snapshots`, "POST"),
      revert: async (vpsName, snapshotName, { destinationVpsName }) =>
        await this.#req(`vps/${vpsName}/snapshots/${snapshotName}`, "PATCH", {
          body: { destinationVpsName },
        }),
      delete: async (vpsName, snapshotName) =>
        await this.#req(`vps/${vpsName}/snapshots/${snapshotName}`),
    },
    backups: {
      list: async (vpsName) => await this.#req(`vps/${vpsName}/backups`),
      revert: async (vpsName, backupId) =>
        await this.#req(`vps/${vpsName}/backups/${backupId}`, "PATCH", {
          body: { action: "revert" },
        }),
      convert: async (vpsName, backupId, { description }) =>
        await this.#req(`vps/${vpsName}/backups/${backupId}`, "PATCH", {
          body: { action: "convert", description },
        }),
    },
    traffic: {
      all: async () => await this.#req(`traffic`),
      get: async (vpsName) => await this.#req(`traffic/${vpsName}`),
    },
    firewall: {
      list: async (vpsName) => await this.#req(`vps/${vpsName}/firewall`),
      update: async (vpsName, { vpsFirewall }) =>
        await this.#req(`vps/${vpsName}/firewall`, "PUT", {
          body: { vpsFirewall },
        }),
    },
    privateNetworks: {
      list: async (vpsName = null) =>
        await this.#req("private-networks", "GET", { params: { vpsName } }),
      get: async (privateNetworkName) =>
        await this.#req(`private-networks/${privateNetworkName}`),
      order: async ({ description = null }) =>
        await this.#req("private-networks", "POST", {
          billing: true,
          body: { description },
        }),
      update: async (privateNetworkName, { privateNetwork }) =>
        await this.#req(`private-neworks/${privateNetworkName}`, "PUT", {
          body: { privateNetwork },
        }),
      attach: async (privateNetworkName, { vpsName }) =>
        await this.#req(`private-networks/${privateNetworkName}`, "PATCH", {
          body: { action: "attachvps", vpsName },
        }),
      detach: async (privateNetworkName, { vpsName }) =>
        await this.#req(`private-networks/${privateNetworkName}`, "PATCH", {
          body: { action: "detachvps", vpsName },
        }),
      cancel: async (privateNetworkName, { endTime = "end" }) =>
        await this.#req(`private-networks/${privateNetworkName}`, "DELETE", {
          body: { endTime },
        }),
    },
    bigStorage: {
      list: async (vpsName = null) =>
        await this.#req("big-storages", "GET", { params: { vpsName } }),
      get: async (bigStorageName) =>
        await this.#req(`big-storages/${bigStorageName}`),
      order: async ({
        size,
        offsiteBackups = null,
        availabilityZone = null,
        vpsName = null,
        description = null,
      }) =>
        await this.#req("big-storages", "POST", {
          billing: true,
          body: {
            size,
            offsiteBackups,
            availabilityZone,
            vpsName,
            description,
          },
        }),
      upgrade: async ({ bigStorageName = null, size, offsiteBackups = null }) =>
        await this.#req("big-storages", "POST", {
          billing: true,
          body: { bigStorageName, size, offsiteBackups },
        }),
      update: async (bigStorageName, { bigStorage }) =>
        await this.#req(`big-storages/${bigStorageName}`, "PUT", {
          body: { bigStorage },
        }),
      cancel: async (bigStorageName, { endTime = "end" }) =>
        await this.#req(`big-storages/${bigStorageName}`, "DELETE", {
          body: { endTime },
        }),
      usage: async (
        bigStorageName,
        { dateTimeStart = null, dateTimeEnd = null }
      ) =>
        await this.#req(`big-storages/${bigStorageName}/usage`, "GET", {
          body: { dateTimeStart, dateTimeEnd },
        }),
      backups: {
        list: async (bigStorageName) =>
          await this.#req(`big-storages/${bigStorageName}/backups`),
        revert: async (bigStorageName, backupId) =>
          await this.#req(
            `big-storages/${bigStorageName}/backups/${backupId}`,
            "PATCH",
            { body: { action: "revert" } }
          ),
      },
    },
    mailService: {
      get: async () => await this.#req("mail-service"),
      regeneratePassword: async () => await this.#req("mail-service", "PATCH"),
      addDnsEntries: async ({ domainNames }) =>
        await this.#req("mail-service", "POST", { body: { domainNames } }),
    },
    monitorContacts: {
      list: async () => await this.#req("monitoring-contacts"),
      create: async ({ name, telephone, email }) =>
        await this.#req("monitoring-contacts", "POST", {
          body: { name, telephone, email },
        }),
      update: async (contactId, { contact }) =>
        await this.#req(`monitoring-contacts/${contactId}`, "PUT", {
          body: { contact },
        }),
      delete: async (contactId) =>
        await this.#req(`monitoring-contacts/${contactId}`, "DELETE"),
    },
    tcpMonitors: {
      list: async (vpsName) => await this.#req(`vps/${vpsName}/tcp-monitors`),
      create: async (vpsName, { tcpMonitor }) =>
        await this.#req(`vps/${vpsName}/tcp-monitors`, "POST", {
          body: { tcpMonitor },
        }),
      update: async (vpsName, ipAddress, { tcpMonitor }) =>
        await this.#req(`vps/${vpsName}/tcp-monitors/${ipAddress}`, "PUT", {
          body: { tcpMonitor },
        }),
      delete: async (vpsName, ipAddress) =>
        await this.#req(`vps/${vpsName}/tcp-monitors/${ipAddress}`),
    },
  };
  haip = {
    list: async () => await this.#req("haips"),
    get: async (haipName) => await this.#req(`haips/${haipName}`),
    order: async ({ productName, description }) =>
      await this.#req(`haips`, "POST", {
        billing: true,
        body: { productName, description },
      }),
    update: async (haipName, { haip }) =>
      await this.#req(`haips/${haipName}`, "PUT", { body: { haip } }),
    cancel: async (haipName, { endTime = "end" }) =>
      await this.#req(`haips/${haipName}`, "DELETE", { body: { endTime } }),
    certificates: {
      list: async (haipName) =>
        await this.#req(`haips/${haipName}/certificates`),
      add: async (haipName, { sslCertificateId }) =>
        await this.#req(`haips/${haipName}/certificates`, "POST", {
          body: { sslCertificateId },
        }),
      addLetsEncrypt: async (haipName, { commonName }) =>
        await this.#req(`haips/${haipName}/certificates`, "POST", {
          body: { commonName },
        }),
      detach: async (haipName, certificateId) =>
        await this.#req(
          `haips/${haipName}/certificates/${certificateId}`,
          "DELETE"
        ),
    },
    ipAddresses: {
      list: async (haipName) =>
        await this.#req(`haips/${haipName}/ip-addresses`),
      set: async (haipName, { ipAddresses }) =>
        await this.#req(`haips/${haipName}/ip-addresses`, "PUT", {
          body: { ipAddresses },
        }),
      detach: async (haipName) =>
        await this.#req(`haips/${haipName}/ip-addresses`, "DELETE"),
    },
    portConfigs: {
      list: async (haipName) =>
        await this.#req(`haips/${haipName}/port-configurations`),
      get: async (haipName, portConfigurationId) =>
        await this.#req(
          `haips/${haipName}/port-configurations/${portConfigurationId}`
        ),
      create: async (
        haipName,
        { name, sourcePort, targetPort, mode, endpointSslMode }
      ) =>
        await this.#req(`haips/${haipName}/port-configurations`, "POST", {
          body: { name, sourcePort, targetPort, mode, endpointSslMode },
        }),
      update: async (haipName, portConfigurationId, { portConfiguration }) =>
        await this.#req(
          `haips/${haipName}/port-configurations/${portConfigurationId}`,
          "PUT",
          { body: { portConfiguration } }
        ),
      delete: async (haipName, portConfigurationId) =>
        await this.#req(
          `haips/${haipName}/port-configurations/${portConfigurationId}`,
          "DELETE"
        ),
    },
    statusReport: async (haipName) =>
      await this.#req(`haips/${haipName}/status-reports`),
  };
  colocations = {
    list: async () => await this.#req("colocations"),
    get: async (colocationName) =>
      await this.#req(`colocations/${colocationName}`),
    ipAddresses: {
      list: async (colocationName) =>
        await this.#req(`colocations/${colocationName}/ip-addresses`),
      get: async (colocationName, ipAddress) =>
        await this.#req(
          `colocations/${colocationName}/ip-addresses/${ipAddress}`
        ),
      create: async (colocationName, { ipAddress, reverseDns }) =>
        await this.#req(`colocations/${colocationName}/ip-addresses`, "POST", {
          body: { ipAddress, reverseDns },
        }),
      setReverseDns: async (colocationName, ipAddress, { ipAddressOptions }) =>
        await this.#req(
          `colocations/${colocationName}/ip-addresses/${ipAddress}`,
          "PUT",
          { body: { ipAddress: ipAddressOptions } }
        ),
      delete: async (colocationName, ipAddress) =>
        await this.#req(
          `colocations/${colocationName}/ip-addresses/${ipAddress}`,
          "DELETE"
        ),
    },
    remoteHands: async (colocationName, { remoteHands }) =>
      await this.#req(`colocations/${colocationName}/remote-hands`, "POST", {
        body: { remoteHands },
      }),
  };
}

export default TransIP;
