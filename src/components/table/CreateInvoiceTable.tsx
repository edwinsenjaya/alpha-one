"use client";

import { InvoiceItemInput, ItemsType } from "@/types/table";

interface CreateInvoiceTableProps {
  invoiceItems: InvoiceItemInput[];
  itemNames: string[];
  itemsByName: Record<string, ItemsType[]>;
  isSaving: boolean;
  formatCurrency: (amount: number) => string;
  onUpdateItem: (
    itemId: string,
    field: keyof InvoiceItemInput,
    value: any,
  ) => void;
  onRemoveItem: (itemId: string) => void;
}

const tableHead = [
  { label: "No", width: "5%" },
  { label: "Nama Kain", width: "20%" },
  { label: "Kode Warna", width: "17%" },
  { label: "Roll", width: "7%" },
  { label: "Satuan Yard", width: "20%" },
  { label: "Harga", width: "14%" },
  { label: "Total", width: "13%" },
  { label: "", width: "4%" },
];

export default function CreateInvoiceTable({
  invoiceItems,
  itemNames,
  itemsByName,
  isSaving,
  formatCurrency,
  onUpdateItem,
  onRemoveItem,
}: CreateInvoiceTableProps) {
  return (
    <table className="w-full border-collapse text-sm">
      <colgroup>
        {tableHead.map((col, i) => (
          <col key={i} style={{ width: col.width }} />
        ))}
      </colgroup>

      <thead>
        <tr className="bg-white">
          {tableHead.map((col, i) => (
            <th
              key={i}
              className="border border-gray-400 p-2 font-medium text-[15px] text-center"
            >
              {col.label}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {invoiceItems.map((item, index) => (
          <tr key={item.id} className="hover:bg-gray-50">
            {/* No */}
            <td className="border border-gray-400 p-2 text-center">
              {index + 1}
            </td>

            {/* Nama Kain */}
            <td className="border border-gray-400 p-2">
              <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                value={item.name}
                onChange={(e) => onUpdateItem(item.id, "name", e.target.value)}
                disabled={isSaving}
              >
                <option value="">Pilih Kain</option>
                {itemNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </td>

            {/* Kode Warna */}
            <td className="border border-gray-400 p-2">
              <select
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={item.color}
                onChange={(e) => onUpdateItem(item.id, "color", e.target.value)}
                disabled={!item.name || isSaving}
              >
                <option value="">-</option>
                {item.name &&
                  itemsByName[item.name]?.map((itm) => (
                    <option key={itm.id} value={itm.color}>
                      {itm.color} (Stok: {itm.roll} roll)
                    </option>
                  ))}
              </select>
            </td>

            {/* Roll */}
            <td className="border border-gray-400 p-2 text-center">
              {item.roll || "-"}
            </td>

            {/* Satuan Yard */}
            <td className="border border-gray-400 p-2">
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                type="text"
                placeholder="68, 71, 72"
                value={item.yardsInput}
                onChange={(e) =>
                  onUpdateItem(item.id, "yardsInput", e.target.value)
                }
                disabled={!item.itemId || isSaving}
              />
            </td>

            {/* Harga */}
            <td className="border border-gray-400 p-2">
              <input
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
                value={item.price || ""}
                onChange={(e) =>
                  onUpdateItem(
                    item.id,
                    "price",
                    parseFloat(e.target.value) || 0,
                  )
                }
                disabled={!item.itemId || isSaving}
              />
            </td>

            {/* Total */}
            <td className="border border-gray-400 p-2 text-right">
              {item.total > 0 ? formatCurrency(item.total) : "-"}
            </td>

            {/* Delete */}
            <td className="border border-gray-400 p-2 text-center">
              <button
                onClick={() => onRemoveItem(item.id)}
                disabled={isSaving || invoiceItems.length === 1}
                className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl transition-colors"
                title="Hapus item"
              >
                ×
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
