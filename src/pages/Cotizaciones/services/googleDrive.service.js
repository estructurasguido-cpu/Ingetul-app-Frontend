// 1. BUSCAR O CREAR CARPETA
export async function getOrCreateFolder(parentId, folderName, token) {
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const searchData = await searchRes.json();
  if (searchData.files?.length) return searchData.files[0].id;

  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
    parents: [parentId],
  };

  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });

  const data = await res.json();
  return data.id;
}

// 2. LISTAR CARPETAS DIRECTAS DE UNA RUTA
export async function listFolders(parentFolderId, token) {
  const url = `https://www.googleapis.com/drive/v3/files?q='${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)&orderBy=name`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  return data.files ?? [];
}

// 3. OBTENER EL NÚMERO SECUENCIAL DE COTIZACIÓN
export async function getCotizacionNumber(fechaClave, referido, token, rootFolderId) {

  const personFolderId = await getOrCreateFolder(rootFolderId, referido || "SinNombre", token);

  const searchUrl = `https://www.googleapis.com/drive/v3/files?q='${personFolderId}' in parents and name contains '${fechaClave}-' and mimeType='application/pdf'&fields=files(name)&orderBy=name desc`;

  const res = await fetch(searchUrl, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();

  if (!data.files?.length) return 1;

  let maxNum = 0;

  data.files.forEach((file) => {
    const match = file.name.match(
      new RegExp(`^${fechaClave}-(\\d+)-`)
    );
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNum) maxNum = num;
    }
  });

  return maxNum + 1;
}

// 4. SUBIR ARCHIVO PDF A GOOGLE DRIVE
export async function uploadPDFToDrive({ pdfBlob, token, folderId, filename, isIphone }) {

  const metadata = {
    name: filename,
    mimeType: "application/pdf",
    parents: [folderId]
  };

  const formData = new FormData();
  formData.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  formData.append("file", pdfBlob);

  // iPhone usa uploadType=media
  const uploadUrl = isIphone
    ? "https://www.googleapis.com/upload/drive/v3/files?uploadType=media"
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  return await res.json();
}