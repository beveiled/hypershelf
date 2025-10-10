import type { ComponentProps } from "react";

export default function VSphereIcon({
  colored,
  ...props
}: ComponentProps<"svg"> & { colored?: boolean }) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path
        data-name="blue"
        d="M8,5c0-1.11.9-2,2-2h8.99c1.11,0,2,.9,2,2v8.99c0,1.11-.9,2-2,2h-8.99c-1.11,0-2-.9-2-2v-3"
        fill="none"
        stroke={colored ? "#0098D4" : "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        data-name="orange"
        d="M16,19c0,1.11-.9,2-2,2H5c-1.11,0-2-.9-2-2v-8.99c0-1.11.9-2,2-2h8.99c1.11,0,2,.9,2,2v3"
        fill="none"
        stroke={colored ? "#F38C00" : "currentColor"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
