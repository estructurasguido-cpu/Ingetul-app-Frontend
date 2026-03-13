/* 1. CREAR O BUSCAR CARPETA */
async function getOrCreateFolder(parentId, folderName, token) {

    const q = `
        name='${folderName}'
        and mimeType='application/vnd.google-apps.folder'
        and '${parentId}' in parents
        and trashed=false
    `.trim();

    const searchUrl =
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

    const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const searchData = await searchRes.json();

    if (searchData.files?.length) {
        return searchData.files[0].id;
    }

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

/* 2. OBTENER NOMBRE FINAL DE CUENTA DE COBRO */
export async function obtenerNombreCuentaCobro({
    token,
    rootFolderId,
    deudorNombre,
}) {

    const nombreLimpio = deudorNombre
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "_");

    const nombreBase = `cuenta-de-cobro_${nombreLimpio}`;

    const q = `
        '${rootFolderId}' in parents
        and mimeType='application/pdf'
        and trashed=false
        and name contains '${nombreBase}'
    `.trim();

    const listUrl =
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(name)`;

    const res = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    let max = 0;

    data.files?.forEach(file => {
        const match = file.name.match(
            new RegExp(`^${nombreBase}(?:-(\\d+))?\\.pdf$`)
        );

        if (match) {
            const n = match[1] ? parseInt(match[1], 10) : 1;
            if (n > max) max = n;
        }
    });

    const suffix = max > 0 ? `-${max + 1}` : "";

    return `${nombreBase}${suffix}.pdf`;
}

/* 3. SUBIR PDF */
async function uploadCuentaCobroPDF({
    pdfBlob,
    token,
    folderId,
    filename,
    isIphone = false,
}) {

    const metadata = {
        name: filename,
        mimeType: "application/pdf",
        parents: [folderId],
    };

    const formData = new FormData();
    formData.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    formData.append("file", pdfBlob);

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

/* 4. GUARDAR CUENTA DE COBRO */
export async function guardarCuentaCobro({
    pdfBlob,
    token,
    rootFolderId,
    deudorNombre,
    isIphone = false,
}) {

    const filename = await obtenerNombreCuentaCobro({
        token,
        rootFolderId,
        deudorNombre,
    });

    return await uploadCuentaCobroPDF({
        pdfBlob,
        token,
        folderId: rootFolderId,
        filename,
        isIphone,
    });
}
