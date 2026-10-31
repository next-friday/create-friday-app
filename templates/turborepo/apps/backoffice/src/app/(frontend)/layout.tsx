import type {Metadata} from "next";

import "./styles.css";

export const metadata: Metadata = {
  title: "Next Friday Payload template",
  description: "Starter application for Next Friday Payload projects.",
};

export default function RootLayout(props: LayoutProps<"/">) {
  const {children} = props;

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
