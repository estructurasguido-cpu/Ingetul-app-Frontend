import ingeguidofirma from "../../../assets/firmas/guido.png";
import ingejulioFirma from "../../../assets/firmas/julio.png";

export const BENEFICIARIOS = {
    INGETUL: {
        empresa: "INGETUL S.A.S.",
        nit: "901298387-2"
    },
    GUIDO: {
        empresa: "Guido Humberto Victoria Barrera",
        nit: "94.365.248"
    }
};

export const FIRMANTES = {
    guido_ingetul: {
        nombre: "GUIDO HUMBERTO VICTORIA BARRERA",
        cargo: "ASESOR INGETUL S.A.S.",
        cedula: "94.365.248",
        telefono: "3159279158",
        direccion: "Calle 28 N°19-38 C.C. Bicentenario Plaza Local E15",
        email: null,
        firma: ingeguidofirma
    },

    guido_personal: {
        nombre: "GUIDO HUMBERTO VICTORIA BARRERA",
        cargo: "INDEPENDIENTE",
        cedula: "94.365.248",
        telefono: "3182759920",
        direccion: null,
        email: "guibeto@me.com",
        firma: ingeguidofirma
    },

    julio: {
        nombre: "JULIO TOCOCHE",
        cargo: "GERENTE TÉCNICO INGETUL S.A.S.",
        cedula: "000000000",
        telefono: "3000000000",
        direccion: "Calle 28 N°19-38 C.C. Bicentenario Plaza Local E15",
        email: null,
        firma: ingejulioFirma
    }
};