import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: {
      target: './openapi.json',
    },
    output: {
      target: 'src/api/endpoints',
      schemas: 'src/api/model',
      client: 'react-query',
      mode: 'tags-split',
      httpClient: 'axios',
      override: {
        mutator: {
          path: 'src/lib/axios-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
})
