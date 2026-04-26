export const endpoints = {
  tableById: (id: string) => `/v1/tables/${id}`,
  lineageByEntity: (id: string) =>
    `/v1/lineage/table/${id}?upstreamDepth=0&downstreamDepth=3`,
  searchTables: "/v1/tables?fields=owners,tags,domains,columns&limit=100",
};
