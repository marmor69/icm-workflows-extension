import { type GeneratedFile, safePath } from "./model";
export interface FileStore {
  read(path: string): Promise<string | undefined>;
  write(path: string, content: string): Promise<void>;
  remove(path: string): Promise<void>;
}
export type Change = GeneratedFile & { before?: string };
export async function preview(
  store: FileStore,
  files: GeneratedFile[],
): Promise<Change[]> {
  const names = new Set<string>();
  const changes: Change[] = [];
  for (const file of files) {
    if (!safePath(file.path) || names.has(file.path.toLowerCase()))
      throw new Error(`Unsafe or colliding output: ${file.path}`);
    names.add(file.path.toLowerCase());
    const before = await store.read(file.path);
    // Placeholder files never modify existing artifacts.
    if (file.path.endsWith("/.gitkeep") && before !== undefined) continue;
    if (before !== file.content) changes.push({ ...file, before });
  }
  return changes;
}
export async function applyChanges(
  store: FileStore,
  changes: Change[],
): Promise<void> {
  for (const change of changes) {
    if (
      !safePath(change.path) ||
      (await store.read(change.path)) !== change.before
    )
      throw new Error(
        `File changed since preview: ${change.path}. Preview again.`,
      );
  }
  const applied: Change[] = [];
  try {
    for (const change of changes) {
      if ((await store.read(change.path)) !== change.before)
        throw new Error(`Concurrent edit: ${change.path}`);
      // Track attempted writes too, as a provider can write partially before throwing.
      applied.push(change);
      await store.write(change.path, change.content);
    }
  } catch (error) {
    const unrestored: string[] = [];
    for (const change of applied.reverse()) {
      try {
        const current = await store.read(change.path);
        if (current === change.before) continue;
        if (current !== change.content) {
          unrestored.push(change.path);
          continue;
        }
        if (change.before === undefined) await store.remove(change.path);
        else await store.write(change.path, change.before);
      } catch {
        unrestored.push(change.path);
      }
    }
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}${unrestored.length ? ` Restore manually from the recovery snapshot: ${unrestored.join(", ")}` : " Applied file changes were rolled back."}`,
    );
  }
}
