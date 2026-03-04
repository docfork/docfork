---
name: docs
description: Fetch up-to-date docs for any library
argument-hint: <library> [query]
---

Fetch current documentation using Docfork and return a direct answer with runnable code examples.

## Examples
```
/docfork:docs react server components
/docfork:docs nextjs app router middleware  
/docfork:docs supabase row level security
/docfork:docs zod nested object validation
```

Use `docfork:search_docs` with the library name, extract `owner/repo` from result URLs for follow-up calls, then `docfork:fetch_doc` for full content. Search results are summaries only.