import { useEffect, useState, useRef } from "react";
import { getDepartamentos, getCiudadesPorDepartamento } from "../services/apiColombia";

const norm = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function useDepartamentos() {
  const [departamentos, setDepartamentos] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  const [departamentoSel, setDepartamentoSel] = useState("");
  const [ciudadSel, setCiudadSel] = useState("");

  const defaultsAplicadosRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const deps = await getDepartamentos();
        setDepartamentos(deps);

        if (departamentoSel) return;

        const valle = deps.find(
          d => norm(d.name) === "valle del cauca"
        );

        if (valle) {
          setDepartamentoSel(String(valle.id));
        }
      } catch (e) {
        console.error("Error cargando departamentos:", e);
      }
    })();
  }, []);

  useEffect(() => {
    if (!departamentoSel) {
      setCiudades([]);
      setCiudadSel("");
      return;
    }

    (async () => {
      try {
        const list = await getCiudadesPorDepartamento(departamentoSel);
        setCiudades(list);

        if (ciudadSel) return;

        if (!defaultsAplicadosRef.current) {
          const tulua = list.find(c => norm(c.name) === "tulua" || norm(c.name) === "tulua (valle)");
          if (tulua) {
            setCiudadSel(tulua.name);
          }
          defaultsAplicadosRef.current = true;
        }
      } catch (e) {
        console.error("Error cargando ciudades:", e);
      }
    })();
  }, [departamentoSel]);

  return {
    departamentos,
    ciudades,
    departamentoSel,
    setDepartamentoSel,
    ciudadSel,
    setCiudadSel,
  };
}
