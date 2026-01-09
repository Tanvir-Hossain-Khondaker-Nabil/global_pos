import React from "react";

export default function BulkBarcodePrint({ purchase, items, business }) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 10 }}>
        Purchase: {purchase?.purchase_no}
      </h2>

      {/* <p style={{ marginBottom: 20 }}>
        Business: {business?.business_name || business?.name || "N/A"}
      </p> */}

      <hr />

      <div style={{ marginTop: 20 }}>
        {items?.map((row, idx) => (
          <div
            key={idx}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 12,
              borderRadius: 8,
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {row?.item?.product?.name || "Product"}{" "}
              {row?.item?.variant?.name ? `(${row.item.variant.name})` : ""}
            </div>

            <div style={{ fontSize: 12, marginTop: 4 }}>
              Batch: <b>{row?.stock?.batch_no || "N/A"}</b>
            </div>
            <div style={{ fontSize: 12 }}>
              Barcode: <b>{row?.stock?.barcode || "N/A"}</b>
            </div>

            {/* SVG from backend */}
            <div
              style={{ marginTop: 10 }}
              dangerouslySetInnerHTML={{ __html: row?.barcode_svg || "" }}
            />
          </div>
        ))}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: "setTimeout(() => window.print(), 500);",
        }}
      />
    </div>
  );
}
