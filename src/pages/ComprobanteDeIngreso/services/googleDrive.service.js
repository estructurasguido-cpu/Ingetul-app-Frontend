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

export async function obtenerConsecutivoDelDia({
    token,
    rootFolderId,
    fecha,
}) {

    const [yyyy, mm, dd] = fecha.split("-");
    const nombreCarpeta = `${dd}${mm}${yyyy}`;

    const folderId = await getOrCreateFolder(
        rootFolderId,
        nombreCarpeta,
        token
    );

    const q = `
        '${folderId}' in parents
        and mimeType='application/pdf'
        and trashed=false
    `.trim();

    const listUrl =
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)`;

    const res = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    let max = 0;

    data.files?.forEach((file) => {
        const match = file.name.match(
            new RegExp(`^${nombreCarpeta}-(\\d+)\\.pdf$`)
        );

        if (match) {
            const n = parseInt(match[1], 10);
            if (n > max) max = n;
        }
    });

    return {
        consecutivo: max + 1,
        folderId,
        nombreCarpeta,
    };
}

async function uploadComprobantePDF({
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

export async function guardarComprobanteIngreso({
    pdfBlob,
    token,
    rootFolderId,
    fecha,
    numero,
    isIphone = false,
}) {

    const [yyyy, mm, dd] = fecha.split("-");
    const nombreCarpeta = `${dd}${mm}${yyyy}`;

    const folderId = await getOrCreateFolder(
        rootFolderId,
        nombreCarpeta,
        token
    );

    const filename = `${numero}.pdf`;

    return await uploadComprobantePDF({
        pdfBlob,
        token,
        folderId,
        filename,
        isIphone,
    });
}
