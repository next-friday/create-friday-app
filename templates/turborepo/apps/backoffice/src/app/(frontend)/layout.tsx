import type {Metadata} from "next";

import "./styles.css";

export const metadata: Metadata = {
  title: "Payload application",
  description: "A Payload application.",
};

export default function RootLayout(props: LayoutProps<"/">) {
  const {children} = props;

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
