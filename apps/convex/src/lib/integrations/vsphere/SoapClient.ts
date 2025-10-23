"use node";

import { DOMParser } from "@xmldom/xmldom";

import type { getClient } from "../../redis";
import type { SoapClientConfig, SoapResponse } from "./types";
import { elementsByLocalName, envelope, escapeXml, text } from "./utils";

export class SoapClient {
  private cookie: string | undefined;
  private readonly url: string;
  private readonly username?: string;
  private readonly password?: string;
  private readonly redis: ReturnType<typeof getClient> | null;
  private static readonly VM_DETAIL_PROPS = [
    "summary.guest.hostName",
    "guest.ipAddress",
    "guest.net",
    "summary.config.numCpu",
    "config.hardware.memoryMB",
    "guest.guestFullName",
    "config.hardware.device",
    "runtime.host",
    "layoutEx",
    "snapshot.rootSnapshotList",
  ] as const;

  constructor(cfg: SoapClientConfig) {
    this.url = cfg.url;
    this.username = cfg.username;
    this.password = cfg.password;
    this.redis = cfg.redis;

    if (!cfg.redis) {
      console.warn("Cold boot of vSphere client without Redis");
    }
  }

  async retrieveAll(
    rootType: "Folder" | "Datacenter",
    rootMoid: string,
  ): Promise<readonly string[]> {
    return this.retrievePaginated(
      this.buildRetrieveEnvelope(rootType, rootMoid),
    );
  }

  async retrieveFolders(
    rootType: "Folder" | "Datacenter",
    rootMoid: string,
  ): Promise<readonly string[]> {
    return this.retrievePaginated(
      this.buildRetrieveFoldersEnvelope(rootType, rootMoid),
    );
  }

  private async retrievePaginated(
    initialXml: string,
  ): Promise<readonly string[]> {
    const pages: string[] = [];
    const body1 = await this.post(initialXml);
    pages.push(body1.text);
    let token = SoapClient.extractToken(body1.text);
    let guards = 0;
    while (token && guards < 200) {
      const body = await this.post(this.buildContinueEnvelope(token));
      pages.push(body.text);
      token = SoapClient.extractToken(body.text);
      guards += 1;
    }
    return pages;
  }

  private async authenticate(): Promise<void> {
    if (!this.username || !this.password) {
      throw new Error("No vSphere credentials provided");
    }
    const loginHeaders: Record<string, string> = {
      "Content-Type": "text/xml",
      SOAPAction: "urn:vim25",
    };
    if (this.cookie) loginHeaders.Cookie = `vmware_soap_session=${this.cookie}`;
    const loginResp = await fetch(this.url, {
      method: "POST",
      headers: loginHeaders,
      body: this.buildLoginEnvelope(this.username, this.password),
    });
    const loginSetCookie = loginResp.headers.get("set-cookie");
    const loginText = await loginResp.text();
    await this.captureCookie(loginSetCookie);
    if (loginResp.status >= 400 || SoapClient.containsFault(loginText))
      throw new Error("Login failed");
    console.log("Authenticated to vSphere as", this.username);
  }

  private async post(xml: string): Promise<SoapResponse> {
    const jitter_from = process.env.VSPHERE_JITTER_MS_FROM ?? 500;
    const jitter_to = process.env.VSPHERE_JITTER_MS_TO ?? 1500;
    if (jitter_from && jitter_to) {
      const ms = Math.floor(
        Math.random() * (Number(jitter_to) - Number(jitter_from) + 1) +
          Number(jitter_from),
      );
      console.log(`Jittering ${ms}ms before vSphere request`);
      await new Promise((r) => setTimeout(r, ms));
    }
    if (this.redis && !this.cookie) {
      try {
        const cached = await this.redis.get("vsphere:session");
        if (cached) this.cookie = cached;
        if (this.cookie)
          console.log(
            "Reusing vSphere session",
            this.cookie.slice(0, 6) + "..." + this.cookie.slice(-4),
          );
      } catch (err) {
        console.error("Failed to get vSphere session from Redis", err);
      }
    }
    const headers: Record<string, string> = {
      "Content-Type": "text/xml",
      SOAPAction: "urn:vim25",
    };
    if (this.cookie) headers.Cookie = `vmware_soap_session=${this.cookie}`;
    const r = await fetch(this.url, { method: "POST", headers, body: xml });
    const setCookieHeader = r.headers.get("set-cookie");
    const txt = await r.text();
    console.log("Got", txt.length, "bytes from vSphere with status", r.status);
    if (r.status === 500) {
      console.error("vSphere returned a 500 error:", txt);
    }
    await this.captureCookie(setCookieHeader);
    if (r.status === 401 || SoapClient.containsNotAuthenticated(txt)) {
      if (!this.username || !this.password)
        throw new Error("Not authenticated and no credentials provided");
      console.log("Session expired, re-authenticating");
      await this.authenticate();
      const againHeaders: Record<string, string> = {
        "Content-Type": "text/xml",
        SOAPAction: "urn:vim25",
      };
      if (this.cookie)
        againHeaders.Cookie = `vmware_soap_session=${this.cookie}`;
      const again = await fetch(this.url, {
        method: "POST",
        headers: againHeaders,
        body: xml,
      });
      const againSetCookie = again.headers.get("set-cookie");
      const againText = await again.text();
      console.log(
        "Got",
        againText.length,
        "bytes from vSphere with status",
        again.status,
      );
      await this.captureCookie(againSetCookie);
      return {
        text: againText,
        setCookieHeader: againSetCookie,
        status: again.status,
      };
    }
    return { text: txt, setCookieHeader, status: r.status };
  }

  private async captureCookie(setCookieHeader: string | null): Promise<void> {
    if (!setCookieHeader) return;
    const m = /vmware_soap_session=([^;]+)/i.exec(setCookieHeader);
    if (m?.[1]) this.cookie = m[1];
    if (this.redis && this.cookie) {
      await this.redis
        .set("vsphere:session", this.cookie, {
          EX: 30 * 60,
        })
        .catch((err) => {
          console.error("Failed to cache vSphere session in Redis", err);
        });
    }
  }

  private buildRetrieveEnvelope(
    rootType: "Folder" | "Datacenter",
    rootMoid: string,
  ): string {
    const propSets = [
      this.propSet("Folder", ["name", "childEntity"]),
      this.propSet("VirtualMachine", [
        "name",
        "summary.guest.ipAddress",
        "summary.guest.hostName",
        "config.hardware.memoryMB",
        "config.hardware.numCPU",
        "runtime.powerState",
        "guest.guestFullName",
        "config.hardware.device",
      ]),
      this.propSet("Datacenter", ["name", "vmFolder"]),
      this.propSet("ServiceInstance", ["content.about.instanceUuid"]),
    ].join("");
    const traversal = `
      <selectSet xsi:type="TraversalSpec">
        <name>dcToVmFolder</name>
        <type>Datacenter</type>
        <path>vmFolder</path>
        <skip>false</skip>
        <selectSet><name>folderTraversal</name></selectSet>
      </selectSet>
      <selectSet xsi:type="TraversalSpec">
        <name>folderTraversal</name>
        <type>Folder</type>
        <path>childEntity</path>
        <skip>false</skip>
        <selectSet><name>folderTraversal</name></selectSet>
        <selectSet><name>dcToVmFolder</name></selectSet>
      </selectSet>
    `;
    const objset = `
      <objectSet>
        <obj type="${rootType}">${escapeXml(rootMoid)}</obj>
        <skip>false</skip>
        ${traversal}
      </objectSet>
      <objectSet>
        <obj type="ServiceInstance">ServiceInstance</obj>
      </objectSet>
    `;
    return envelope(`
      <vim25:RetrievePropertiesEx>
        <_this type="PropertyCollector">propertyCollector</_this>
        <specSet>
          ${propSets}
          ${objset}
        </specSet>
        <options/>
      </vim25:RetrievePropertiesEx>
    `);
  }

  private propSet<
    T extends
      | "Folder"
      | "VirtualMachine"
      | "Datacenter"
      | "ServiceInstance"
      | "ClusterComputeResource"
      | "ComputeResource"
      | "HostSystem",
  >(
    vtype: T,
    paths: readonly string[],
  ): `<propSet><type>${T}</type>${string}</propSet>` {
    const pathXml = paths.map((p) => `<pathSet>${p}</pathSet>`).join("");
    return `<propSet><type>${vtype}</type>${pathXml}</propSet>`;
  }

  private buildContinueEnvelope(token: string): string {
    return envelope(`
      <vim25:ContinueRetrievePropertiesEx>
        <_this type="PropertyCollector">propertyCollector</_this>
        <token>${escapeXml(token)}</token>
      </vim25:ContinueRetrievePropertiesEx>
    `);
  }

  private buildLoginEnvelope(user: string, password: string): string {
    return envelope(`
      <vim25:Login>
        <_this type="SessionManager">SessionManager</_this>
        <userName>${escapeXml(user)}</userName>
        <password>${escapeXml(password)}</password>
      </vim25:Login>
    `);
  }

  private buildRetrieveFoldersEnvelope(
    rootType: "Folder" | "Datacenter",
    rootMoid: string,
  ): string {
    const propSets = [
      this.propSet("Folder", ["name", "childEntity"]),
      this.propSet("Datacenter", ["vmFolder"]),
    ].join("");
    const traversal = `
      <selectSet xsi:type="TraversalSpec">
        <name>dcToVmFolder</name>
        <type>Datacenter</type>
        <path>vmFolder</path>
        <skip>false</skip>
        <selectSet><name>folderTraversal</name></selectSet>
      </selectSet>
      <selectSet xsi:type="TraversalSpec">
        <name>folderTraversal</name>
        <type>Folder</type>
        <path>childEntity</path>
        <skip>false</skip>
        <selectSet><name>folderTraversal</name></selectSet>
        <selectSet><name>dcToVmFolder</name></selectSet>
      </selectSet>
    `;
    const objset = `
      <objectSet>
        <obj type="${rootType}">${escapeXml(rootMoid)}</obj>
        <skip>false</skip>
        ${traversal}
      </objectSet>
    `;
    return envelope(`
      <vim25:RetrievePropertiesEx>
        <_this type="PropertyCollector">propertyCollector</_this>
        <specSet>
          ${propSets}
          ${objset}
        </specSet>
        <options/>
      </vim25:RetrievePropertiesEx>
    `);
  }

  private static extractToken(xml: string): string | undefined {
    const d = new DOMParser().parseFromString(xml, "text/xml");
    const tokens = elementsByLocalName(d, "token");
    return tokens.length > 0 && tokens[0] ? text(tokens[0]).trim() : undefined;
  }

  private static containsNotAuthenticated(xml: string): boolean {
    const d = new DOMParser().parseFromString(xml, "text/xml");
    const faults = elementsByLocalName(d, "fault");
    if (faults.length > 0 && faults[0]) {
      const t = text(faults[0]);
      if (/The session is not authenticated/i.test(t)) {
        return true;
      }
    }

    const notAuthFaults = elementsByLocalName(d, "NotAuthenticatedFault");
    if (notAuthFaults.length > 0) {
      return true;
    }

    for (const fault of faults) {
      const typeAttr = fault.getAttribute("xsi:type");
      if (typeAttr === "NotAuthenticated") {
        return true;
      }
    }
    if (faults.length > 0 && faults[0]) {
      const t = text(faults[0]);
      return /NotAuthenticated|Session not authenticated/i.test(t);
    }
    return false;
  }

  private static containsFault(xml: string): boolean {
    const d = new DOMParser().parseFromString(xml, "text/xml");
    return elementsByLocalName(d, "Fault").length > 0;
  }

  private buildRetrieveVmCoreEnvelope(moid: string): string {
    const propSets = [
      this.propSet("VirtualMachine", [...SoapClient.VM_DETAIL_PROPS]),
      this.propSet("HostSystem", ["parent"]),
      this.propSet("ComputeResource", ["name"]),
      this.propSet("ClusterComputeResource", ["name"]),
    ].join("");
    const traversal = `
      <selectSet xsi:type="TraversalSpec">
        <name>vmToHost</name>
        <type>VirtualMachine</type>
        <path>runtime.host</path>
        <skip>false</skip>
        <selectSet><name>hostToParent</name></selectSet>
      </selectSet>
      <selectSet xsi:type="TraversalSpec">
        <name>hostToParent</name>
        <type>HostSystem</type>
        <path>parent</path>
        <skip>false</skip>
      </selectSet>
    `;
    const objset = `
      <objectSet>
        <obj type="VirtualMachine">${escapeXml(moid)}</obj>
        <skip>false</skip>
        ${traversal}
      </objectSet>
    `;
    return envelope(`
      <vim25:RetrievePropertiesEx>
        <_this type="PropertyCollector">propertyCollector</_this>
        <specSet>
          ${propSets}
          ${objset}
        </specSet>
        <options/>
      </vim25:RetrievePropertiesEx>
    `);
  }

  private buildFindByIpEnvelope(ip: string): string {
    return envelope(`
      <vim25:FindByIp>
        <_this type="SearchIndex">SearchIndex</_this>
        <datacenter type="Datacenter">datacenter-1001</datacenter>
        <ip>${escapeXml(ip)}</ip>
        <vmSearch>true</vmSearch>
      </vim25:FindByIp>
    `);
  }

  private buildFindByDnsNameEnvelope(hostname: string): string {
    return envelope(`
      <vim25:FindByDnsName>
        <_this type="SearchIndex">SearchIndex</_this>
        <datacenter type="Datacenter">datacenter-1001</datacenter>
        <dnsName>${escapeXml(hostname)}</dnsName>
        <vmSearch>true</vmSearch>
      </vim25:FindByDnsName>
    `);
  }

  private buildFindByInventoryPathEnvelope(vmName: string): string {
    return envelope(`
      <vim25:FindByInventoryPath>
        <_this type="SearchIndex">SearchIndex</_this>
        <inventoryPath>vm/${escapeXml(vmName)}</inventoryPath>
      </vim25:FindByInventoryPath>
    `);
  }

  async findCandidatesSingle(
    ip?: string | null,
    hostname?: string | null,
  ): Promise<{ ipMoRef?: string | null; hostMoRef?: string | null }> {
    if (ip) {
      const xml = this.buildFindByIpEnvelope(ip);
      const body = await this.post(xml);
      const d = new DOMParser().parseFromString(body.text, "text/xml");
      const ipResp = elementsByLocalName(d, "FindByIpResponse");
      if (ipResp.length > 0 && ipResp[0]) {
        const rv = elementsByLocalName(ipResp[0], "returnval");
        if (rv.length > 0 && rv[0]) {
          const ipMoRef = rv.length ? text(rv[0]).trim() || null : null;
          if (ipMoRef) {
            return { ipMoRef };
          }
        }
      }
    }

    if (hostname) {
      const xml = this.buildFindByDnsNameEnvelope(hostname);
      const body = await this.post(xml);
      const d = new DOMParser().parseFromString(body.text, "text/xml");
      const dnsResp = elementsByLocalName(d, "FindByDnsNameResponse");
      if (dnsResp.length > 0 && dnsResp[0]) {
        const rv = elementsByLocalName(dnsResp[0], "returnval");
        if (rv.length === 0 || !rv[0]) {
          return { hostMoRef: null };
        }
        const hostMoRef = rv.length ? text(rv[0]).trim() || null : null;
        if (hostMoRef) {
          return { hostMoRef };
        }
      }
    }

    if (hostname) {
      const xml = this.buildFindByInventoryPathEnvelope(hostname);
      const body = await this.post(xml);
      const d = new DOMParser().parseFromString(body.text, "text/xml");
      const vmResp = elementsByLocalName(d, "FindByInventoryPathResponse");
      if (vmResp.length > 0 && vmResp[0]) {
        const rv = elementsByLocalName(vmResp[0], "returnval");
        if (rv.length === 0 || !rv[0]) {
          return { hostMoRef: null };
        }
        const hostMoRef = text(rv[0]).trim() || null;
        if (hostMoRef) {
          return { hostMoRef };
        }
      }
    }

    return { ipMoRef: null, hostMoRef: null };
  }

  async retrieveVmCore(moid: string): Promise<SoapResponse> {
    const xml = this.buildRetrieveVmCoreEnvelope(moid);
    const body = await this.post(xml);
    return body;
  }

  private buildRetrieveVmDetailsUnderRootEnvelope(
    rootType: "Folder" | "Datacenter",
    rootMoid: string,
  ): string {
    const propSets = [
      this.propSet("VirtualMachine", [...SoapClient.VM_DETAIL_PROPS]),
      this.propSet("HostSystem", ["parent"]),
      this.propSet("ComputeResource", ["name"]),
      this.propSet("ClusterComputeResource", ["name"]),
    ].join("");
    const traversal = `
      <selectSet xsi:type="TraversalSpec">
        <name>dcToVmFolder</name>
        <type>Datacenter</type>
        <path>vmFolder</path>
        <skip>false</skip>
        <selectSet><name>folderTraversal</name></selectSet>
      </selectSet>
      <selectSet xsi:type="TraversalSpec">
        <name>folderTraversal</name>
        <type>Folder</type>
        <path>childEntity</path>
        <skip>false</skip>
        <selectSet><name>folderTraversal</name></selectSet>
        <selectSet><name>dcToVmFolder</name></selectSet>
        <selectSet><name>vmToHost</name></selectSet>
      </selectSet>
      <selectSet xsi:type="TraversalSpec">
        <name>vmToHost</name>
        <type>VirtualMachine</type>
        <path>runtime.host</path>
        <skip>false</skip>
        <selectSet><name>hostToParent</name></selectSet>
      </selectSet>
      <selectSet xsi:type="TraversalSpec">
        <name>hostToParent</name>
        <type>HostSystem</type>
        <path>parent</path>
        <skip>false</skip>
      </selectSet>
    `;
    const objset = `
      <objectSet>
        <obj type="${rootType}">${escapeXml(rootMoid)}</obj>
        <skip>false</skip>
        ${traversal}
      </objectSet>
    `;
    return envelope(`
      <vim25:RetrievePropertiesEx>
        <_this type="PropertyCollector">propertyCollector</_this>
        <specSet>
          ${propSets}
          ${objset}
        </specSet>
        <options/>
      </vim25:RetrievePropertiesEx>
    `);
  }

  async retrieveVmDetailsUnderRoot(
    rootType: "Folder" | "Datacenter",
    rootMoid: string,
  ): Promise<readonly string[]> {
    return this.retrievePaginated(
      this.buildRetrieveVmDetailsUnderRootEnvelope(rootType, rootMoid),
    );
  }

  private buildPreheatEnvelope(): string {
    return envelope(`
      <vim25:RetrievePropertiesEx>
        <_this type="PropertyCollector">propertyCollector</_this>
        <specSet>
          <propSet>
            <type>SessionManager</type>
            <pathSet>currentSession</pathSet>
          </propSet>
          <objectSet>
            <obj type="SessionManager">SessionManager</obj>
          </objectSet>
        </specSet>
        <options/>
      </vim25:RetrievePropertiesEx>
    `);
  }

  // ? Should be called for methods that might return 200 without fault if
  // ? auth session is invalid
  async preheat(retry = true): Promise<{ ok: boolean; user: string | null }> {
    const body = await this.post(this.buildPreheatEnvelope());
    const d = new DOMParser().parseFromString(body.text, "text/xml");
    let ok = true;
    if (SoapClient.containsNotAuthenticated(body.text)) {
      ok = false;
    }
    if (SoapClient.containsFault(body.text)) {
      ok = false;
    }
    const u = elementsByLocalName(d, "userName");
    const user = u.length && u[0] ? text(u[0]).trim() : null;
    if ((!ok || !user) && retry) {
      await this.authenticate();
      return this.preheat(false);
    }

    return { ok: !!user, user };
  }
}
