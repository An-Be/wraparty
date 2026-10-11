// Shapes the solves route returns. Shared so client components never import a
// server module, even for types.
export type DailyAggregates = { solved: number; averageLinks: number | null };

export type SolveResponse = { links: number; vsPar: "UNDER" | "PAR" | "OVER"; aggregates: DailyAggregates };
