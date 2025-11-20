export function computeWithSaldo(list) {
    let saldo = 0;
    return list.map(it => {
      const entra = Number(it.entra) || 0;
      const sale = Number(it.sale) || 0;
      saldo = saldo + entra - sale;
      return { ...it, saldo };
    });
}