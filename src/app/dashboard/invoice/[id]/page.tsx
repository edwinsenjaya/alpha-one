import InvoiceDetailContent from "./InvoiceDetailContent";

export function generateStaticParams() {
  return [{ id: "1" }];
}

export default function DetailInvoicePage() {
  return <InvoiceDetailContent />;
}
