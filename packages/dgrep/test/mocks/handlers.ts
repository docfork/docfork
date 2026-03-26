import { http, HttpResponse } from "msw";

const API_URL = "https://api.docfork.com/v1";

export const handlers = [
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
];
