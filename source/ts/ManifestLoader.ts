export class ManifestLoader {
  async load(): Promise<Record<string, string[]>> {
    const res = await fetch('./index.json');
    if (!res.ok) {
      throw new Error('Manifest not found');
    }
    return await res.json();
  }
}