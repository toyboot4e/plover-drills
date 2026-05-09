import type { DrillData } from '../Drill';

export type DrillFile = { name: string; loadDrillData: () => Promise<DrillData> };

const parseDrillData = (text: string): DrillData =>
  text
    .trim()
    .split('\n')
    .map((line) => {
      const columns = line.split('\t');
      return {
        word: columns[0],
        outline: columns[1].split('/'),
      };
    });

export const generateDrills = (data: Record<string, () => Promise<{ default: string }>>): Array<DrillFile> => {
  return Object.entries(data)
    .map(([path, load]) => ({
      // biome-ignore lint/style/noNonNullAssertion: ignore
      name: path.split('/').pop()!,
      loadDrillData: async () => {
        const text = await load();
        return parseDrillData(text.default);
      },
    }))
    .sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
};
