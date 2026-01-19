export function today() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
}

export function numeroALetras(num) {
    if (num === null || num === undefined || isNaN(num)) return "";

    const entero = Math.floor(Number(num));
    const centavos = Math.round((Number(num) - entero) * 100);

    if (entero === 0) {
        return "CERO PESOS (0 COP)";
    }

    const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco",
        "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince",
        "dieciséis", "diecisiete", "dieciocho", "diecinueve",
    ];

    const veintis = ["veinte", "veintiuno", "veintidós", "veintitrés",
        "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
    ];

    const decenas = [
        "", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa",
    ];

    const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos",
        "seiscientos", "setecientos", "ochocientos", "novecientos",
    ];

    function convertirGrupo(n) {
        if (n === 0) return "";
        if (n === 100) return "cien";

        let texto = "";

        if (n > 99) {
            texto += centenas[Math.floor(n / 100)] + " ";
            n = n % 100;
        }

        if (n >= 20 && n <= 29) {
            texto += veintis[n - 20];
            return texto.trim();
        }

        if (n >= 30) {
            texto += decenas[Math.floor(n / 10)];
            if (n % 10 !== 0) texto += " y " + unidades[n % 10];
            return texto.trim();
        }

        texto += unidades[n];
        return texto.trim();
    }

    const millones = Math.floor(entero / 1_000_000);
    const miles = Math.floor((entero % 1_000_000) / 1_000);
    const resto = entero % 1_000;

    let letras = "";

    if (millones > 0) {
        letras +=
            millones === 1
                ? "un millón "
                : convertirGrupo(millones) + " millones ";
    }

    if (miles > 0) {
        letras +=
            miles === 1 ? "mil " : convertirGrupo(miles) + " mil ";
    }

    if (resto > 0) {
        letras += convertirGrupo(resto);
    }

    letras = letras.trim();

    letras = letras.replace(/\buno\b$/, "un");

    const terminaEnMillonExacto =
        millones > 0 && miles === 0 && resto === 0;

    const esSingular = entero === 1;

    let resultado;

    if (esSingular) {
        resultado = `${letras.toUpperCase()} PESO`;
    } else if (terminaEnMillonExacto) {
        resultado = `${letras.toUpperCase()} DE PESOS`;
    } else {
        resultado = `${letras.toUpperCase()} PESOS`;
    }

    if (centavos > 0) {
        resultado += ` CON ${centavos}/100`;
    }

    return `${resultado} (${entero.toLocaleString("es-CO")} COP)`;
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