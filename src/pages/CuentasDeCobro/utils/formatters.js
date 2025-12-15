export function today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

export function numeroALetras(num) {
    if (!num || num === 0) return "CERO PESOS";

    const unidades = [
        "", "uno", "dos", "tres", "cuatro", "cinco",
        "seis", "siete", "ocho", "nueve", "tiene",
        "once", "doce", "trece", "catorce", "quince",
        "dieciséis", "diecisiete", "dieciocho", "diecinueve"
    ];

    const veintis = [
        "", "", "veintidós", "veintitrés", "veinticuatro",
        "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"
    ];

    const decenas = [
        "", "", "veinte", "treinta", "cuarenta",
        "cincuenta", "sesenta", "setenta", "ochenta", "noventa"
    ];

    const centenas = [
        "", "ciento", "doscientos", "trescientos",
        "cuatrocientos", "quinientos", "seiscientos",
        "setecientos", "ochocientos", "novecientos"
    ];

    function convertirGrupos(n) {
        let salida = "";

        if (n === 100) return "cien";

        if (n > 99) {
            salida += centenas[Math.floor(n / 100)] + " ";
            n = n % 100;
        }

        if (n >= 21 && n <= 29) {
            salida += veintis[n - 20];
            return salida.trim();
        }

        if (n === 20) return (salida + "veinte").trim();

        if (n > 19) {
            salida += decenas[Math.floor(n / 10)];
            if (n % 10 !== 0) salida += " y " + unidades[n % 10];
        } else {
            salida += unidades[n];
        }

        return salida.trim();
    }

    const millones = Math.floor(num / 1_000_000);
    const miles = Math.floor((num % 1_000_000) / 1_000);
    const resto = num % 1_000;

    let letras = "";

    if (millones > 0) {
        letras += millones === 1
            ? "un millón "
            : convertirGrupos(millones) + " millones ";
    }

    if (miles > 0) {
        letras += miles === 1
            ? "mil "
            : convertirGrupos(miles) + " mil ";
    }

    if (resto > 0) {
        letras += convertirGrupos(resto);
    }

    letras = letras.replace(/\s+/g, " ").trim();

    // ===========================================
    // REGLA: agregar "DE PESOS" cuando corresponde
    // ===========================================
    const terminaEnMillonExacto = (miles === 0 && resto === 0 && millones > 0);

    const sufijo = terminaEnMillonExacto
        ? "DE PESOS"
        : "PESOS";

    return `${letras.toUpperCase()} ${sufijo} (${num.toLocaleString("es-CO")} COP)`;
}

const MESES = [
    "enero", "febrero", "marzo", "abril",
    "mayo", "junio", "julio", "agosto",
    "septiembre", "octubre", "noviembre", "diciembre"
];

export function formatearFecha(fechaISO) {
    if (!fechaISO) return "";

    const [year, month, day] = fechaISO.split("-");
    return `${parseInt(day)} de ${MESES[parseInt(month) - 1]} del ${year}`;
}