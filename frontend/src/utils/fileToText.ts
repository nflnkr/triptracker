export async function fileToText(file: File) {
    const buffer = await file.arrayBuffer();
    const view = new Uint8Array(buffer);
    const decoder = new TextDecoder("utf-8");
    return decoder.decode(view);
}