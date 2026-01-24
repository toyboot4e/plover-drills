import type { DrillData } from '../Drill';

export const generateDrills = (
  data: Record<string, { default: string }>,
): Array<{ name: string; drillData: DrillData }> => {
  return Object.entries(data)
    .map(([path, text]) => {
      const drillData: DrillData = text.default
        .trim()
        .split('\n')
        .map((line) => {
          const columns = line.split('\t');
          return {
            word: columns[0],
            outline: columns[1].split('/'),
          };
        });

      return {
        // biome-ignore lint/style/noNonNullAssertion: ignore
        name: path.split('/').pop()!,
        drillData,
      };
    })
    .sort((a, b) => {
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
};
