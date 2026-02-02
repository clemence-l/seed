export type CellState = "unknown" | "filled" | "empty";

export type GivenCell = {
  r: number;
  c: number;
  state: "filled" | "empty";
};

export type LineRule = {
  count: number;
  groups: number;
};

export type DanmenLevel = {
  id: string;
  game: "danmen";
  size: number;
  difficulty: 1 | 2 | 3;
  rules: {
    rows: LineRule[];
    cols: LineRule[];
  };
  givens: GivenCell[];
  /** Solution complète du niveau (pour indices). Optionnelle. */
  solution?: CellState[][];
};
