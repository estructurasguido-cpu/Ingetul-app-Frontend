export default function MedioPago({
    medioPago,
    cheque,
    handleChange,
    handleChequeChange,
}) {
    const disabled = medioPago === "efectivo";

    return (
        <div className="grid grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Medio de pago</label>
                <select
                    name="medioPago"
                    value={medioPago}
                    onChange={handleChange}
                    className="border rounded px-2 py-1"
                >
                    <option value="efectivo">Efectivo</option>
                    <option value="cheque">Cheque</option>
                </select>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Cheque No.</label>
                <input
                    name="numero"
                    value={cheque.numero}
                    onChange={handleChequeChange}
                    disabled={disabled}
                    className="border rounded px-2 py-1 disabled:bg-gray-100"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Banco</label>
                <input
                    name="banco"
                    value={cheque.banco}
                    onChange={handleChequeChange}
                    disabled={disabled}
                    className="border rounded px-2 py-1 disabled:bg-gray-100"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Sucursal</label>
                <input
                    name="sucursal"
                    value={cheque.sucursal}
                    onChange={handleChequeChange}
                    disabled={disabled}
                    className="border rounded px-2 py-1 disabled:bg-gray-100"
                />
            </div>
        </div>
    );
}
