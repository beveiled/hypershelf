/*
https://github.com/beveiled/hypershelf
Copyright (C) 2025  Daniil Gazizullin

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import type { MaskitoOptions } from "@maskito/core";

export const ipv4CidrMaskOptions: MaskitoOptions = {
  mask: /^(((\d+\.){0,2}\d+\.?)|((\d+\.){3}\d+))(\/([0-9]{0,2}))?$/,
  postprocessors: [
    ({ value, selection }) => {
      const [initialFrom, initialTo] = selection;
      let [from, to] = selection;

      const boundIpParts = (ip: string) => {
        let partsOfIp = ip.split(".");
        partsOfIp = partsOfIp.map(part => {
          const partNum = parseInt(part);
          if (partNum > 255) return "255";
          if (part.startsWith("0") && part.endsWith("0")) return "0";
          if (part.startsWith("0") && part !== "0")
            return part.replaceAll("0", "");
          return part;
        });
        return partsOfIp.join(".");
      };

      const boundSubnet = (ip: string) => {
        const address = ip.split("/")[0] ?? "";
        let subnet = ip.split("/")[1] ?? "";
        if (subnet.startsWith("0") && subnet.endsWith("0")) subnet = "0";
        else if (subnet.startsWith("0") && subnet !== "0")
          subnet = subnet.replaceAll("0", "");
        const subnetNum = parseInt(subnet);
        if (subnetNum > 32) subnet = "32";
        return `${address}/${subnet}`;
      };

      const processedIntegerPart = Array.from(value).reduce(
        (formattedValuePart, char, i) => {
          if (formattedValuePart.includes("/")) {
            return boundSubnet(formattedValuePart + char);
          }

          const partsOfIp = formattedValuePart.split(".");
          const lastPartOfIp = partsOfIp[partsOfIp.length - 1] ?? "";
          const isPositionForSeparator =
            !(char === ".") &&
            formattedValuePart.length &&
            (lastPartOfIp.length === 3 ||
              partsOfIp[partsOfIp.length - 1].startsWith("0"));

          if (partsOfIp.length > 4) {
            return formattedValuePart;
          }

          if (!isPositionForSeparator) {
            return boundIpParts(formattedValuePart + char);
          }

          if (i <= initialFrom) {
            from++;
          }
          if (i <= initialTo) {
            to++;
          }

          if (partsOfIp.length >= 4) {
            if (char === "/") char = "";
            return formattedValuePart + "/" + char;
          }

          return formattedValuePart + "." + char;
        },
        ""
      );

      return {
        value: processedIntegerPart,
        selection: [from, to]
      };
    }
  ]
};
