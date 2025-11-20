import { forwardRef } from "react";

const PDFCotizacion = forwardRef(function PDFCotizacion(
  {
    fecha,
    ciudad,
    departamentoName,
    dirigido,
    referido,
    tiempoDeEntrega,
    objeto,
    notas,
    items,
    granTotal,
    proyecto,
  },
  ref
) {
  return (
    <div
      ref={ref}
      style={{
        fontFamily: "Arial, sans-serif",
        width: "800px",
        backgroundColor: "#fff",
        color: "#222",
        padding: "35px 45px",
        lineHeight: "1.35",
        fontSize: "13px",
      }}
    >

      {/* --- FECHA Y CIUDAD --- */}
      <div style={{ textAlign: "right", fontSize: "13px", marginBottom: "10px" }}>
        <div>{fecha}</div>
        <div>{ciudad} - {departamentoName}</div>
      </div>

      {/* --- TÍTULO --- */}
      <h2
        style={{
          textAlign: "center",
          color: "#0051ff",
          margin: "5px 0 18px 0",
          borderBottom: "1px solid #0051ff",
          paddingBottom: "3px",
          fontSize: "18px",
        }}
      >
        Cotización
      </h2>

      {/* --- DATOS GENERALES --- */}
      <div style={{ marginBottom: "15px", lineHeight: "1.4" }}>
        <div><strong>Dirigido a:</strong> {dirigido}, <strong>Referido:</strong> {referido}</div>
        <div><strong>Tiempo de entrega:</strong> {tiempoDeEntrega} días</div>
        <div><strong>Objeto:</strong> {objeto}</div>
      </div>

      {/* -------- TABLA -------- */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          marginTop: "10px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#0051ff", color: "#fff" }}>
            {["Descripción", "UND", "CANT", "Vr. Unitario", "Vr. Total"].map(
              (t) => (
                <th
                  key={t}
                  style={{
                    padding: "6px 4px",
                    border: "1px solid #ccc",
                    fontWeight: "bold",
                  }}
                >
                  {t}
                </th>
              )
            )}
          </tr>
        </thead>

        <tbody>
          {items.map((it, i) => (
            <tr key={i}>
              <td style={{ border: "1px solid #ccc", padding: "5px" }}>{it.desc}</td>
              <td style={{ border: "1px solid #ccc", textAlign: "center", padding: "5px" }}>
                {it.und}
              </td>
              <td style={{ border: "1px solid #ccc", textAlign: "center", padding: "5px" }}>
                {it.cant}
              </td>
              <td style={{ border: "1px solid #ccc", textAlign: "right", padding: "5px" }}>
                {it.unit.toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                })}
              </td>
              <td style={{ border: "1px solid #ccc", textAlign: "right", padding: "5px" }}>
                {(it.cant * it.unit).toLocaleString("es-CO", {
                  style: "currency",
                  currency: "COP",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* --- TOTAL --- */}
      <div
        style={{
          textAlign: "right",
          fontWeight: "bold",
          fontSize: "14px",
          marginTop: "10px",
        }}
      >
        Total:{" "}
        {granTotal.toLocaleString("es-CO", {
          style: "currency",
          currency: "COP",
        })}
      </div>

      {/* --- NOTAS --- */}
      <div style={{ marginTop: "20px" }}>
        <h3
          style={{
            color: "#0051ff",
            fontSize: "15px",
            marginBottom: "5px",
            borderBottom: "1px solid #0051ff",
            display: "inline-block",
            paddingBottom: "2px",
          }}
        >
          Notas
        </h3>

        <div
          style={{
            whiteSpace: "pre-line",
            fontSize: "13px",
            marginTop: "5px",
          }}
        >
          {notas}
        </div>
      </div>

      {/* --- RESPONSABLE --- */}
      <div style={{ marginTop: "20px" }}>
        <h3
          style={{
            color: "#0051ff",
            fontSize: "15px",
            marginBottom: "5px",
            borderBottom: "1px solid #0051ff",
            display: "inline-block",
            paddingBottom: "2px",
          }}
        >
          Responsable / Aprobación
        </h3>

        <div style={{ lineHeight: "1.4", marginTop: "4px" }}>
          <div><strong>Aprobado por:</strong></div>
          <div>INGETUL SAS</div>
          <div>
            3143284624 - Cl. 28 #19-18 a 19-52, C.C. Bicentenario Plaza, local 15,
            Cl. 28, Tuluá, Valle del Cauca
          </div>
          <div>ingetulsas@gmail.com</div>
          <div><strong>Proyecto:</strong> {proyecto}</div>
        </div>
      </div>
    </div>
  );
});

export default PDFCotizacion;
