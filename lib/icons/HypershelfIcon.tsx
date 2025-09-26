import { ComponentProps } from "react";

export default function HypershelfIcon(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path
        d="M17.61,5.66v3.94c0,.18-.15.33-.33.33H6.72c-.18,0-.33-.15-.33-.33v-3.94c0-.18-.15-.33-.33-.33h-3.73c-.18,0-.33.15-.33.33v12.67c0,.18.15.33.33.33h3.73c.18,0,.33-.15.33-.33v-4.11c0-.18.15-.33.33-.33h10.56c.18,0,.33.15.33.33v4.11c0,.18.15.33.33.33h3.73c.18,0,.33-.15.33-.33V5.66c0-.18-.15-.33-.33-.33h-3.73c-.18,0-.33.15-.33.33Z"
        fill="none"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="2"
      />
    </svg>
  );
}
