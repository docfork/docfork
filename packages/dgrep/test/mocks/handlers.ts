import { http, HttpResponse } from "msw";

const API_URL = "https://api.docfork.com/v1";

export const handlers = [
  http.post(`${API_URL}/search`, () => {
    return HttpResponse.json({
      object: "search_result",
      results: [
        {
          id: "chunk-1",
          score: 0.95,
          title: "useState",
          content: "useState is a React Hook that lets you add a state variable.",
          path: "reference/react/useState.md",
          url: "https://react.dev/reference/react/useState",
          start_line: 1,
          end_line: 20,
          parent_headers: ["Hooks"],
          library: "react",
        },
      ],
      meta: {
        query: "hooks",
        libraries: { resolved: ["react"], unresolved: [] },
        reranked: true,
        usage: { chunks_searched: 50, chunks_returned: 1, embedding_tokens: 4 },
        performance: { latency_ms: 42 },
      },
    });
  }),

  http.get(`${API_URL}/search`, () => {
    return HttpResponse.json({
      sections: [
        {
          url: "https://react.dev/reference/react/useState",
          title: "useState",
          description: "useState is a React Hook that lets you add a state variable.",
        },
      ],
    });
  }),

  http.get(`${API_URL}/read`, () => {
    return HttpResponse.json({
      text: "# useState\n\nuseState is a React Hook.",
      library_identifier: "facebook/react",
      version_info: "19.1.0",
    });
  }),

  http.get(`${API_URL}/libraries/search`, () => {
    return HttpResponse.json({
      libraries: [{ id: "1", name: "React", identifier: "facebook/react" }],
    });
  }),

  http.post(`${API_URL}/keys/provision`, () => {
    return HttpResponse.json({
      api_key: "docf_test_key_123",
      key_prefix: "docf_test_key_1",
      organization_id: "org-123",
      expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
      claim_url: "https://app.docfork.com/claim?token=test",
    });
  }),

  http.post(`${API_URL}/libraries/resolve`, () => {
    return HttpResponse.json({
      resolved: [],
      unresolved: [],
    });
  }),
];
