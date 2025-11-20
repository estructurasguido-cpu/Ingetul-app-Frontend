export const getDepartamentos = async () => {
    const res = await fetch("https://api-colombia.com/api/v1/Department");
    return await res.json();
  };
  
export const getCiudadesPorDepartamento = async (depId) => {
    const res = await fetch(`https://api-colombia.com/api/v1/Department/${depId}/cities`);
    return await res.json();
};